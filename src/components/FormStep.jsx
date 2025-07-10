import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { ChevronDownIcon, ChevronRightIcon, PlusIcon, TrashIcon, SearchIcon } from 'lucide-react';
import MapComponent from './MapComponent';

// MultiSelect Component
const MultiSelect = ({ field, fieldName, register, fieldError, isInvalid, handleFieldChange }) => {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedValues, setSelectedValues] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (field.dataSource) {
      loadOptions();
    }
  }, [field.dataSource]);

  const loadOptions = async () => {
    if (field.label === 'Select a Location Type') {
      // eslint-disable-next-line no-console
      console.log('loadOptions running for Select a Location Type');
    }
    if (field && field.dataSource && field.dataSource.columns) {
      // eslint-disable-next-line no-console
      console.log('loadOptions:', field.label, 'columns.display:', field.dataSource.columns.display);
    }
    if (!field.dataSource?.file) return;
    
    const columns = field.dataSource.columns;
    setLoading(true);
    try {
      const response = await fetch(field.dataSource.file);
      
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status}`);
      }
      
      const csvText = await response.text();
      
      // Robust CSV parsing (handles quoted fields)
      function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current);
        return result;
      }

      const lines = csvText.split('\n');
      const headers = parseCSVLine(lines[0]);
      let data = lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const row = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || '';
        });
        return row;
      }).filter(row => row.active === 'TRUE');

      // Apply the formatting formula
      const formattedOptions = data.map(row => {
        if (columns?.display) {
          // Handle the DISTINCT formula format
          if (columns.display.includes('DISTINCT')) {
            // Extract column name from DISTINCT(description_1) format
            const match = columns.display.match(/DISTINCT\(([^)]+)\)/);
            if (match) {
              const colName = match[1];
              return row[colName];
            }
          }
          // Handle the CONCATENATE formula format
          if (columns.display.includes('CONCATENATE')) {
            // Extract column names from the formula
            const matches = columns.display.match(/[A-Z]\d+/g);
            if (matches) {
              const displayCols = matches.map(match => {
                // Convert Excel column reference to column name
                const colIndex = match.charCodeAt(0) - 65; // A=0, B=1, etc.
                return headers[colIndex];
              });
              // Only include non-empty values
              return displayCols
                .map(col => row[col])
                .filter(val => val && val.length > 0)
                .join(' - ');
            }
          } else {
            // Handle comma-separated column names
            const displayCols = columns.display.split(',').map(col => col.trim());
            return displayCols
              .map(col => row[col])
              .filter(val => val && val.length > 0)
              .join(' - ');
          }
        }
        return row[columns?.value] || row[headers[0]];
      });
      
      // Create distinct options if DISTINCT is specified
      let finalOptions;
      if (columns?.display?.includes('DISTINCT')) {
        // Build a map from description_1 to value_1 (first occurrence only)
        const seen = new Set();
        finalOptions = [];
        data.forEach(row => {
          const displayCol = columns.display.match(/DISTINCT\(([^)]+)\)/)[1];
          const valueCol = columns.value;
          const displayValue = row[displayCol];
          const backingValue = row[valueCol];
          if (displayValue && !seen.has(displayValue)) {
            seen.add(displayValue);
            finalOptions.push({ value: backingValue, label: displayValue });
          }
        });
        if (field.label === 'Select a Location Type') {
          // eslint-disable-next-line no-console
          console.log('DISTINCT description/value pairs:', finalOptions);
        }
      } else {
        finalOptions = formattedOptions.map((option, index) => ({
          value: data[index][columns?.value || headers[0]],
          label: option
        }));
      }
      setOptions(finalOptions);
    } catch (error) {
      // console.error('Error loading options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionToggle = (optionValue) => {
    let newSelectedValues;
    if (selectedValues.includes(optionValue)) {
      newSelectedValues = selectedValues.filter(value => value !== optionValue);
    } else {
      newSelectedValues = [...selectedValues, optionValue];
    }
    setSelectedValues(newSelectedValues);
    handleFieldChange(field, newSelectedValues);
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return 'Select options...';
    }
    if (selectedValues.length === 1) {
      const option = options.find(opt => opt.value === selectedValues[0]);
      return option ? option.label : '1 item selected';
    }
    return `${selectedValues.length} items selected`;
  };

  if (loading) {
    return <div className="text-gray-500 text-sm">Loading options...</div>;
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-left ${
          isInvalid ? 'border-red-500' : 'border-gray-300'
        } ${selectedValues.length > 0 ? 'bg-blue-50' : 'bg-white'}`}
      >
        <span className={selectedValues.length > 0 ? 'text-blue-900' : 'text-gray-500'}>
          {getDisplayText()}
        </span>
        <ChevronDownIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {options.map((option, index) => (
            <label key={index} className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedValues.includes(option.value)}
                onChange={() => handleOptionToggle(option.value)}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

// SearchableCombo Component
const SearchableCombo = ({ field, fieldName, register, fieldError, isInvalid, handleFieldChange, filterBy, setValue, onFocus, onBlur, onBackingValueChange, onActiveChange, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedValue, setSelectedValue] = useState('');
  const [readOnly, setReadOnly] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const selectedItemRef = useRef(null);

  const filteredOptions = isTyping
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  useEffect(() => {
    // Only load options for Select Location Use if filterBy is set
    if (field.label === 'Select Location Use' && !filterBy) {
      setOptions([]);
      return;
    }
    if (field.dataSource) {
      loadOptions();
    }
  }, [
    field.dataSource?.file,
    field.dataSource?.columns?.display,
    field.dataSource?.columns?.value,
    filterBy
  ]);

  useEffect(() => {
    if (isOpen) {
      if (selectedItemRef.current) {
        selectedItemRef.current.scrollIntoView({ block: 'nearest' });
      } else if (filteredOptions.length > 0) {
        const firstItem = document.querySelector('.dropdown-option');
        if (firstItem) firstItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [isOpen, filteredOptions]);

  const loadOptions = async () => {
    if (field.label === 'Select Location Use' && !filterBy) { setOptions([]); setLoading(false); return; }
    if (!field.dataSource?.file) return;
    const columns = field.dataSource.columns;
    setLoading(true);
    try {
      const response = await fetch(field.dataSource.file);
      
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status}`);
      }
      
      const csvText = await response.text();
      
      // Robust CSV parsing (handles quoted fields)
      function parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
          const char = line[i];
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current);
        return result;
      }

      const lines = csvText.split('\n');
      const headers = parseCSVLine(lines[0]);
      let data = lines.slice(1).map(line => {
        const values = parseCSVLine(line);
        const row = {};
        headers.forEach((header, index) => {
          row[header.trim()] = values[index]?.trim() || '';
        });
        return row;
      }).filter(row => row.active === 'TRUE');

      // If this is the Select Location Use field and filterBy is set, filter by first word or part before dash
      if (field.label === 'Select Location Use' && filterBy) {
        data = data.filter(row => {
          // Build the display value as it will be shown
          let displayValue = '';
          if (columns.display.includes('CONCATENATE')) {
            // Parse CONCATENATE(description_1," - ",description_2) format
            const concatenateMatch = columns.display.match(/CONCATENATE\(([^)]+)\)/);
            if (concatenateMatch) {
              const innerContent = concatenateMatch[1];
              // Split by comma and handle quoted strings
              const parts = [];
              let current = '';
              let inQuotes = false;
              for (let i = 0; i < innerContent.length; i++) {
                const char = innerContent[i];
                if (char === '"') {
                  inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                  parts.push(current.trim());
                  current = '';
                } else {
                  current += char;
                }
              }
              parts.push(current.trim());
              
              // Extract column names (skip quoted strings)
              const columnNames = parts.filter(part => !part.startsWith('"') && !part.endsWith('"'));
              
              displayValue = columnNames
                .map(col => row[col])
                .filter(val => val && val.length > 0)
                .join(' - ');
            }
          } else if (columns.display.includes(',')) {
            const displayCols = columns.display.split(',').map(col => col.trim());
            displayValue = displayCols
              .map(col => row[col])
              .filter(val => val && val.length > 0)
              .join(' - ');
          } else {
            displayValue = row[columns.display] || '';
          }
          // Extract first word or part before dash
          const firstPart = displayValue.split(/[- ]/)[0];
          return firstPart.toLowerCase() === filterBy.toLowerCase();
        });
      }

      // Apply the formatting formula for display and construct backing value
      const parseConcatenate = (formula, headers) => {
        // Map Excel-style references to actual header names if possible
        const excelToHeader = {
          'E2': 'value_1',
          'F2': 'value_2',
          'G2': 'value_3',
          'H2': 'description_1',
          'I2': 'description_2',
          'J2': 'description_3',
        };
        const parts = [];
        const excelRegex = /([A-Z]\d+)/g;
        const headerRegex = /([a-zA-Z0-9_]+)/g;
        let match;
        if (formula.match(excelRegex)) {
          while ((match = excelRegex.exec(formula)) !== null) {
            const excelRef = match[1];
            if (excelToHeader[excelRef] && headers.includes(excelToHeader[excelRef])) {
              parts.push(excelToHeader[excelRef]);
            } else {
              // Fallback to index-based mapping
              const colIndex = excelRef.charCodeAt(0) - 65;
              parts.push(headers[colIndex]);
            }
          }
        } else {
          const inner = formula.replace(/^CONCATENATE\(/, '').replace(/\)$/,'');
          const headerMatches = Array.from(inner.matchAll(headerRegex));
          headerMatches.forEach(m => {
            if (headers.includes(m[1])) parts.push(m[1]);
          });
        }
        return parts;
      };

      const formattedOptions = data.map(row => {
        let displayValue = '';
        let backingValue = '';
        // Display value
        if (columns?.display && columns.display.includes('CONCATENATE')) {
          const displayParts = parseConcatenate(columns.display, headers);
          displayValue = displayParts.map(col => row[col]).filter(Boolean).join(' - ');
        } else if (columns?.display && columns.display.includes('DISTINCT')) {
          // Extract the column name from DISTINCT(column_name)
          const match = columns.display.match(/DISTINCT\(([^)]+)\)/);
          if (match) {
            const columnName = match[1];
            displayValue = row[columnName] || '';
          }
        } else if (columns?.display) {
          displayValue = row[columns.display] || '';
        }
        // Backing value
        if (columns?.value && columns.value.includes('CONCATENATE')) {
          // Find separator (e.g., '||')
          let sep = '||';
          const sepMatch = columns.value.match(/","(.*?)","/);
          if (sepMatch) sep = sepMatch[1];
          const valueParts = parseConcatenate(columns.value, headers);
          backingValue = valueParts.map(col => row[col]).filter(Boolean).join(sep);
        } else if (columns?.value) {
          backingValue = row[columns.value] || '';
        }
        return { displayValue, backingValue };
      });
      
      // Create distinct options if DISTINCT is specified
      let finalOptions;
      if (columns?.display?.includes('DISTINCT')) {
        const distinctMap = new Map();
        formattedOptions.forEach((option, index) => {
          if (option.displayValue && option.displayValue.trim()) {
            if (!distinctMap.has(option.displayValue)) {
              if (!option.backingValue) {
                // console.warn('DISTINCT: Empty backing value for label', option.displayValue, 'at row', index, option);
              } else {
                // console.log('DISTINCT: Setting label', option.displayValue, 'to value', option.backingValue);
              }
              distinctMap.set(option.displayValue, option.backingValue);
            }
          }
        });
        finalOptions = Array.from(distinctMap.entries()).map(([label, value]) => ({
          value: value,
          label: label
        }));
      } else {
        finalOptions = formattedOptions.map((option, index) => ({
          value: option.backingValue,
          label: option.displayValue
        }));
      }
      setOptions(finalOptions);
    } catch (error) {
      // console.error('Error loading options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (option) => {
    setIsTyping(false);
    setSelectedValue(option.value);
    setSearchTerm(option.label);
    setIsOpen(false);
    handleFieldChange(field, option.value);
    if (setValue) {
      setValue(fieldName, option.value, { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    }
    // Track the backing value and display label
    if (onBackingValueChange) {
      onBackingValueChange(fieldName, option.value, option.label);
    }
    if (onActiveChange) onActiveChange(fieldName, false);
  };

  // Sync selectedValue with form value
  useEffect(() => {
    // Try to get the value from the form (if available)
    if (register && typeof register === 'function') {
      const input = document.querySelector(`input[name='${fieldName}']`);
      if (input && input.value !== selectedValue) {
        setSelectedValue(input.value);
      }
    }
  }, [fieldName, register]);

  return (
    <>
      <div className="mb-4 relative">
        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
          {field.label}
          {field.required && <span className="text-red-500">*</span>}
        </label>
        
        <div className="relative">
          <div className="flex items-center">
            <input
              name={fieldName}
              type="text"
              value={searchTerm}
              readOnly={readOnly}
              onMouseDown={e => {
                if (readOnly) {
                  setReadOnly(false);
                  setIsTyping(false);
                  setIsOpen(true);
                  e.preventDefault();
                  e.target.focus();
                } else {
                  setIsTyping(false);
                  setIsOpen(true);
                }
              }}
              onBlur={(e) => {
                // Delay hiding to allow click events to fire
                setTimeout(() => {
                  setReadOnly(true);
                  setIsTyping(false);
                  setIsOpen(false);
                  if (onBlur) {
                    onBlur(fieldName);
                  }
                }, 200);
              }}
              onFocus={() => {
                setIsTyping(false);
                setIsOpen(true);
                if (onFocus) {
                  onFocus(fieldName);
                }
                if (onActiveChange) onActiveChange(fieldName, true);
              }}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsTyping(true);
                setIsOpen(true);
              }}
              placeholder="Search..."
              autoComplete="new-password"
              autoCorrect="off"
              spellCheck={false}
              className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isInvalid ? 'border-red-500' : 'border-gray-300'
              }`}
              disabled={disabled}
            />
            <SearchIcon className="absolute right-3 h-4 w-4 text-gray-400" />
          </div>
          
          {isOpen && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {loading ? (
                <div className="px-3 py-2 text-gray-500">Loading...</div>
              ) : filteredOptions.length > 0 ? (
                filteredOptions.map((option, index) => {
                  const isSelected = option.value === selectedValue;
                  return (
                    <button
                      key={index}
                      type="button"
                      ref={isSelected ? selectedItemRef : null}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleSelect(option);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      className={`dropdown-option w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none${isSelected ? ' bg-blue-50 font-semibold' : ''}`}
                    >
                      {option.label}
                    </button>
                  );
                })
              ) : (
                <div className="px-3 py-2 text-gray-500">No options found</div>
              )}
            </div>
          )}
        </div>
        
        <input
          type="hidden"
          {...register(fieldName, { 
            required: field.required,
            value: selectedValue
          })}
        />
        
        {isInvalid && (
          <p className="text-red-500 text-sm mt-1">{fieldError}</p>
        )}
      </div>
    </>
  );
};

const FormStep = ({ step, formData, defaultData, onSubmit, onPrevious, showPrevious = false }) => {
  const [errors, setErrors] = useState({});
  const [collapsedSections, setCollapsedSections] = useState({});
  const [units, setUnits] = useState([]);
  const [focusedField, setFocusedField] = useState(null);
  const [lastFocusedField, setLastFocusedField] = useState(null);
  const [backingValues, setBackingValues] = useState({});
  const [locationTypeDisplay, setLocationTypeDisplay] = useState('');
  

  const { register, handleSubmit, formState: { isValid }, setValue, watch, getValues } = useForm({
    mode: 'onChange'
  });

  const formValues = watch();
  const selectedLocationType = formValues?.locationSection?.locationType;
  
  // Initialize with one unit if this is a multi-unit step
  useEffect(() => {
    if (step.allowMultipleUnits && units.length === 0) {
      addUnit();
    }
  }, [step.allowMultipleUnits]);

  // Pre-fill form fields with default data
  useEffect(() => {
    if (defaultData) {
      // Handle sections
      if (step.sections) {
        step.sections.forEach(section => {
          if (section.fields) {
            section.fields.forEach(field => {
              if (defaultData[field.name] !== undefined) {
                setValue(field.name, defaultData[field.name]);
              }
            });
          }
        });
      }
      
      // Handle unit template
      if (step.allowMultipleUnits && step.unitTemplate) {
        if (step.unitTemplate.fields) {
          // Handle fields directly
          step.unitTemplate.fields.forEach(field => {
            // Pre-fill for first unit
            const fieldName = `unit-1.${field.name}`;
            if (defaultData[fieldName] !== undefined) {
              setValue(fieldName, defaultData[fieldName]);
            }
          });
        } else if (step.unitTemplate.sections) {
          // Handle sections (backward compatibility)
          step.unitTemplate.sections.forEach(section => {
            if (section.fields) {
              section.fields.forEach(field => {
                // Pre-fill for first unit
                const fieldName = `unit-1.${field.name}`;
                if (defaultData[fieldName] !== undefined) {
                  setValue(fieldName, defaultData[fieldName]);
                }
              });
            }
          });
        }
      }
      
      // Handle direct fields (backward compatibility)
      if (step.fields) {
        step.fields.forEach(field => {
          if (defaultData[field.name] !== undefined) {
            setValue(field.name, defaultData[field.name]);
          }
        });
      }
    } else {
      // Generate default data for searchable combo fields
      if (step.fields) {
        step.fields.forEach(field => {
          if (field.type === 'searchable-combo' && field.name === 'incidentType1') {
            // Set a default incident type for the first combo box
            setValue(field.name, 'CONSTRUCTION_WASTE');
          }
        });
      }
    }
  }, [defaultData, step, setValue]);

  const validateField = (field, value) => {
    if (!field.validation) return true;
    
    const { rule, message } = field.validation;
    
    switch (rule) {
      case 'required':
        return value && value.trim() !== '' ? true : message || 'This field is required';
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(value) ? true : message || 'Please enter a valid email';
      case 'phone':
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        return phoneRegex.test(value.replace(/[\s\-\(\)]/g, '')) ? true : message || 'Please enter a valid phone number';
      default:
        return true;
    }
  };

  const handleFieldChange = (field, value) => {
    const error = validateField(field, value);
    setErrors(prev => ({
      ...prev,
      [field.name]: error === true ? null : error
    }));
  };

  const toggleSection = (sectionName) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const addUnit = () => {
    const newUnitId = `unit-${Date.now()}`;
    const unitNumber = units.length + 1;
    const unitDesignation = unitNumber === 1 ? 'Engine 1' : unitNumber === 2 ? 'Engine 2' : 'Ladder 1';
    
    // Pre-fill the new unit with default data
    if (step.unitTemplate) {
      if (step.unitTemplate.fields) {
        // Handle fields directly
        step.unitTemplate.fields.forEach(field => {
          const fieldName = `${newUnitId}.${field.name}`;
          const now = new Date();
          const currentTime = now.toISOString().slice(0, 16);
          
          let defaultValue = '';
          switch (field.type) {
            case 'text':
              if (field.name === 'respondingUnitDesignation') {
                defaultValue = unitDesignation;
              } else {
                defaultValue = `Sample ${field.label}`;
              }
              break;
            case 'number':
              if (field.name === 'respondingUnitStaffing') {
                defaultValue = 4;
              } else {
                defaultValue = field.min || 1;
              }
              break;
            case 'datetime-local':
              defaultValue = currentTime;
              break;
            case 'latitude':
              defaultValue = 40.7128;
              break;
            case 'longitude':
              defaultValue = -74.0060;
              break;
            default:
              defaultValue = '';
          }
          setValue(fieldName, defaultValue);
        });
      } else if (step.unitTemplate.sections) {
        // Handle sections (backward compatibility)
        step.unitTemplate.sections.forEach(section => {
          if (section.fields) {
            section.fields.forEach(field => {
              const fieldName = `${newUnitId}.${field.name}`;
              const now = new Date();
              const currentTime = now.toISOString().slice(0, 16);
              
              let defaultValue = '';
              switch (field.type) {
                case 'text':
                  if (field.name === 'respondingUnitDesignation') {
                    defaultValue = unitDesignation;
                  } else {
                    defaultValue = `Sample ${field.label}`;
                  }
                  break;
                case 'number':
                  if (field.name === 'respondingUnitStaffing') {
                    defaultValue = 4;
                  } else {
                    defaultValue = field.min || 1;
                  }
                  break;
                case 'datetime-local':
                  defaultValue = currentTime;
                  break;
                case 'latitude':
                  defaultValue = 40.7128;
                  break;
                case 'longitude':
                  defaultValue = -74.0060;
                  break;
                default:
                  defaultValue = '';
              }
              setValue(fieldName, defaultValue);
            });
          }
        });
      }
    }
    
    setUnits(prev => [...prev, { id: newUnitId, designation: unitDesignation }]);
  };

  const removeUnit = (unitId) => {
    setUnits(prev => prev.filter(unit => unit.id !== unitId));
  };

  const updateUnitDesignation = (unitId, designation) => {
    setUnits(prev => prev.map(unit => 
      unit.id === unitId ? { ...unit, designation } : unit
    ));
  };

  const renderField = (field, unitId = null, parentValues = null) => {
    const values = parentValues || getValues();
    const fieldName = unitId ? `${unitId}.${field.name}` : field.name;
    const fieldError = errors[fieldName];
    const isInvalid = fieldError && fieldError !== true;

    // Handle conditional fields
    if (field.conditional) {
      if (field.conditional.show !== undefined) {
        // Enhanced: Evaluate conditional.show as a JS expression with access to all form values (section or global)
        if (typeof field.conditional.show === 'string') {
          let shouldShow = true;
          try {
            const argNames = Object.keys(values);
            const argValues = Object.values(values);
            // eslint-disable-next-line no-new-func
            const fn = new Function(...argNames, `return (${field.conditional.show});`);
            shouldShow = fn(...argValues);
          } catch (e) {
            shouldShow = false;
          }
          if (!shouldShow) {
            return null; // Don't render this field
          }
        } else if (typeof field.conditional.show === 'boolean') {
          if (!field.conditional.show) {
            return null; // Don't render this field
          }
        }
      } else if (field.conditional.field) {
        // Handle old conditional structure
        const conditionalFieldName = field.conditional.field;
        const conditionalValue = values[conditionalFieldName];
        
        // Handle nested field paths (e.g., "locationSection.isAddressable")
        if (conditionalFieldName.includes('.')) {
          const parts = conditionalFieldName.split('.');
          const sectionName = parts[0];
          const fieldName = parts[1];
          const sectionData = values[sectionName];
          const actualValue = sectionData?.[fieldName];
          
          // Handle "any" value - show field if any value is selected
          if (field.conditional.value === 'any') {
            if (!actualValue || actualValue === '') {
              return null; // Don't render this field if no value is selected
            }
          } else if (actualValue !== field.conditional.value) {
            return null; // Don't render this field
          }
        } else {
          // Handle direct field references
          // Handle "any" value - show field if any value is selected
          if (field.conditional.value === 'any') {
            if (!conditionalValue || conditionalValue === '') {
              return null; // Don't render this field if no value is selected
            }
          } else if (conditionalValue !== field.conditional.value) {
            return null; // Don't render this field
          }
        }
      }
    }

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={field.type}
              {...register(fieldName, { 
                required: false,
                onChange: (e) => {
                  handleFieldChange(field, e.target.value);
                  if (unitId && field.name === 'respondingUnitDesignation') {
                    updateUnitDesignation(unitId, e.target.value);
                  }
                }
              })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isInvalid ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={field.placeholder || ''}
            />
            {isInvalid && (
              <p className="text-red-500 text-sm mt-1">{fieldError}</p>
            )}
          </div>
        );

      case 'number':
        return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              {...register(fieldName, { 
                required: false,
                onChange: (e) => handleFieldChange(field, e.target.value)
              })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isInvalid ? 'border-red-500' : 'border-gray-300'
              }`}
              min={field.min}
              max={field.max}
              step={field.step}
            />
            {isInvalid && (
              <p className="text-red-500 text-sm mt-1">{fieldError}</p>
            )}
          </div>
        );

      case 'date':
      case 'datetime-local':
        return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={field.type}
              {...register(fieldName, { 
                required: false,
                onChange: (e) => handleFieldChange(field, e.target.value)
              })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isInvalid ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {isInvalid && (
              <p className="text-red-500 text-sm mt-1">{fieldError}</p>
            )}
          </div>
        );



      case 'checkbox':
        return (
          <div key={fieldName} className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                {...register(fieldName, { 
                  required: false,
                  onChange: (e) => handleFieldChange(field, e.target.checked)
                })}
                className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </span>
            </label>
            {isInvalid && (
              <p className="text-red-500 text-sm mt-1">{fieldError}</p>
            )}
          </div>
        );

      case 'checkbox-array':
        return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              {field.dataSource ? (
                <MultiSelect
                  field={field}
                  fieldName={fieldName}
                  register={register}
                  fieldError={fieldError}
                  isInvalid={isInvalid}
                  handleFieldChange={handleFieldChange}
                />
              ) : (
                <p className="text-gray-500 text-sm">No options available</p>
              )}
            </div>
            {isInvalid && (
              <p className="text-red-500 text-sm mt-1">{fieldError}</p>
            )}
          </div>
        );

      case 'multi-select':
        return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              {field.dataSource ? (
                <MultiSelect
                  field={field}
                  fieldName={fieldName}
                  register={register}
                  fieldError={fieldError}
                  isInvalid={isInvalid}
                  handleFieldChange={handleFieldChange}
                />
              ) : (
                <p className="text-gray-500 text-sm">No options available</p>
              )}
            </div>
            {isInvalid && (
              <p className="text-red-500 text-sm mt-1">{fieldError}</p>
            )}
          </div>
        );

      case 'radio':
        return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2 text-left">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <div className="space-y-2">
              {field.options?.map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    value={option.value}
                    {...register(fieldName, { 
                      required: false,
                      onChange: (e) => handleFieldChange(field, e.target.value)
                    })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
            {isInvalid && (
              <p className="text-red-500 text-sm mt-1">{fieldError}</p>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              {...register(fieldName, { 
                required: false,
                onChange: (e) => handleFieldChange(field, e.target.value)
              })}
              rows={field.rows || 3}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isInvalid ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder={field.placeholder || ''}
            />
            {isInvalid && (
              <p className="text-red-500 text-sm mt-1">{fieldError}</p>
            )}
          </div>
        );

      case 'latitude':
        return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
              Latitude
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              step="0.000001"
              {...register(fieldName, { 
                required: false,
                onChange: (e) => handleFieldChange(field, e.target.value)
              })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isInvalid ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="40.7128"
            />
            {isInvalid && (
              <p className="text-red-500 text-sm mt-1">{fieldError}</p>
            )}
          </div>
        );

      case 'longitude':
        return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
              Longitude
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="number"
              step="0.000001"
              {...register(fieldName, { 
                required: false,
                onChange: (e) => handleFieldChange(field, e.target.value)
              })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isInvalid ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="-74.0060"
            />
            {isInvalid && (
              <p className="text-red-500 text-sm mt-1">{fieldError}</p>
            )}
          </div>
        );

      case 'searchable-combo':
        // For all incident type combos and location type, pass the handlers
        if (
          fieldName.endsWith('incidentType1') ||
          fieldName.endsWith('incidentType2') ||
          fieldName.endsWith('incidentType3') ||
          field.label === 'Select a Location Type'
        ) {
          return (
            <SearchableCombo
              key={fieldName}
              field={field}
              fieldName={fieldName}
              register={register}
              fieldError={errors[fieldName]}
              isInvalid={!!errors[fieldName]}
              handleFieldChange={handleFieldChange}
              setValue={setValue}
              onFocus={(fieldName) => setLastFocusedField(fieldName)}
              onBackingValueChange={(fieldName, value, label) => {
                setBackingValues(prev => ({ ...prev, [fieldName]: value }));
                if (field.label === 'Select a Location Type') setLocationTypeDisplay(label);
              }}
            />
          );
        }
        if (field.label === 'Select Location Use') {
          return (
            <SearchableCombo
              key={fieldName}
              field={field}
              fieldName={fieldName}
              register={register}
              fieldError={errors[fieldName]}
              isInvalid={!!errors[fieldName]}
              handleFieldChange={handleFieldChange}
              filterBy={locationTypeDisplay}
              setValue={setValue}
              onFocus={(fieldName) => setLastFocusedField(fieldName)}
              onBackingValueChange={(fieldName, value) => setBackingValues(prev => ({ ...prev, [fieldName]: value }))}
              disabled={!locationTypeDisplay}
            />
          );
        }
        // Default
        return (
          <SearchableCombo
            key={fieldName}
            field={field}
            fieldName={fieldName}
            register={register}
            fieldError={errors[fieldName]}
            isInvalid={!!errors[fieldName]}
            handleFieldChange={handleFieldChange}
            setValue={setValue}
            onFocus={(fieldName) => setLastFocusedField(fieldName)}
            onBackingValueChange={(fieldName, value) => setBackingValues(prev => ({ ...prev, [fieldName]: value }))}
          />
        );

      case 'map': {
        // Get the location method value from the correct field path
        const methodValue = getValues().locationSection?.locationMethod || getValues().locationMethod;
        
        const allowPinDrop = methodValue === 'point';
        const allowPolygon = methodValue === 'area';
        
        return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <MapComponent 
              allowPinDrop={allowPinDrop}
              allowPolygon={allowPolygon}
            />
            {isInvalid && (
              <p className="text-red-500 text-sm mt-1">{fieldError}</p>
            )}
          </div>
        );
      }

      case 'array': {
        // For array of objects (e.g., respondingUnits with multiple fields per unit)
        const values = watch(field.name) || [{}];
        const minItems = field.minItems || 1;
        
        const addItem = () => {
          const newItem = {};
          if (field.item.type === 'object' && field.item.fields) {
            field.item.fields.forEach(subField => {
              // Set default values based on field type
              switch (subField.type) {
                case 'text':
                  newItem[subField.name] = '';
                  break;
                case 'number':
                  newItem[subField.name] = subField.min || 0;
                  break;
                case 'datetime-local':
                  newItem[subField.name] = new Date().toISOString().slice(0, 16);
                  break;
                default:
                  newItem[subField.name] = '';
              }
            });
          }
          setValue(field.name, [...values, newItem]);
        };
        
        const removeItem = (idx) => {
          if (values.length > minItems) {
            setValue(field.name, values.filter((_, i) => i !== idx));
          }
        };
        
        const handleItemFieldChange = (idx, fieldName, val) => {
          const newArr = [...values];
          newArr[idx] = { ...newArr[idx], [fieldName]: val };
          setValue(field.name, newArr);
        };
        
        if (field.item.type === 'object' && field.item.fields) {
          return (
            <div key={field.name} className="mb-6">
              <label className="block mb-3 text-left section-header">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              <div className="space-y-4">
                {values.map((unit, idx) => (
                  <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-end mb-3">
                      {values.length > minItems && (
                        <button 
                          type="button" 
                          onClick={() => removeItem(idx)} 
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {field.item.fields.map(subField => {
                        const subFieldName = `${field.name}.${idx}.${subField.name}`;
                        const subFieldError = errors[subFieldName];
                        const isSubFieldInvalid = subFieldError && subFieldError !== true;
                        
                        return (
                          <div key={subFieldName} className="mb-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
                              {subField.label}
                              {subField.required && <span className="text-red-500">*</span>}
                            </label>
                            {subField.type === 'text' && (
                              <input
                                type="text"
                                value={unit[subField.name] || ''}
                                onChange={e => handleItemFieldChange(idx, subField.name, e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  isSubFieldInvalid ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder={subField.placeholder || ''}
                              />
                            )}
                            {subField.type === 'number' && (
                              <input
                                type="number"
                                value={unit[subField.name] || ''}
                                onChange={e => handleItemFieldChange(idx, subField.name, e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  isSubFieldInvalid ? 'border-red-500' : 'border-gray-300'
                                }`}
                                min={subField.min}
                                max={subField.max}
                                step={subField.step}
                                placeholder={subField.placeholder || ''}
                              />
                            )}
                            {subField.type === 'datetime-local' && (
                              <input
                                type="datetime-local"
                                value={unit[subField.name] || ''}
                                onChange={e => handleItemFieldChange(idx, subField.name, e.target.value)}
                                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                  isSubFieldInvalid ? 'border-red-500' : 'border-gray-300'
                                }`}
                              />
                            )}
                            {isSubFieldInvalid && (
                              <p className="text-red-500 text-sm mt-1">{subFieldError}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <button 
                type="button" 
                onClick={addItem} 
                className="mt-3 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                {field.addButtonLabel || 'Add Unit'}
              </button>
              {isInvalid && (
                <p className="text-red-500 text-sm mt-1">{fieldError}</p>
              )}
            </div>
          );
        } else {
          // Fallback to simple array of text fields (original implementation)
          const addItem = () => {
            setValue(field.name, [...values, '']);
          };
          const removeItem = (idx) => {
            if (values.length > minItems) {
              setValue(field.name, values.filter((_, i) => i !== idx));
            }
          };
          const handleItemChange = (idx, val) => {
            const newArr = [...values];
            newArr[idx] = val;
            setValue(field.name, newArr);
            handleFieldChange(field.item, val);
          };
          return (
            <div key={field.name} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              <div className="space-y-2">
                {values.map((val, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={val}
                      onChange={e => handleItemChange(idx, e.target.value)}
                      className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={field.item.label || ''}
                    />
                    {values.length > minItems && (
                      <button type="button" onClick={() => removeItem(idx)} className="p-1 text-red-500 hover:text-red-700">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={addItem} className="mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                {field.addButtonLabel || 'Add'}
              </button>
              {isInvalid && (
                <p className="text-red-500 text-sm mt-1">{fieldError}</p>
              )}
            </div>
          );
        }
      }



      case 'section':
        return (
          <div key={fieldName} className="mb-6 border border-gray-200 rounded-lg">
            <div className="px-4 py-1 bg-gray-50 rounded-t-lg text-left section-header">
              {field.label}
            </div>
            <div className="p-4 bg-white rounded-b-lg">
              {field.fields?.map(subField => renderField(subField, fieldName))}
            </div>
          </div>
        );

      case 'select':
        const renderedField = (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
              {field.label}
              {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              {...register(fieldName, { 
                required: false,
                onChange: (e) => handleFieldChange(field, e.target.value)
              })}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isInvalid ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">Select an option</option>
              {field.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {isInvalid && (
              <p className="text-red-500 text-sm mt-1">{fieldError}</p>
            )}
          </div>
        );

        // Handle conditional fields within select fields
        if (field.conditional && field.conditional.fields) {
          const conditionalFields = field.conditional.fields.map(conditionalField => 
            renderField(conditionalField, unitId)
          ).filter(Boolean); // Remove null/undefined fields

          return (
            <div key={`${fieldName}-with-conditionals`}>
              {renderedField}
              {conditionalFields.length > 0 && (
                <div className="ml-4 mt-2 pl-4 border-l-2 border-gray-200">
                  {conditionalFields}
                </div>
              )}
            </div>
          );
        }

        return renderedField;

      default:
        return null;
    }
  };

  const renderSection = (section, unitId = null) => {
    const sectionKey = unitId ? `${unitId}-${section.name}` : section.name;
    const isCollapsed = collapsedSections[sectionKey];
    const sectionValues = getValues(section.name) || {};

    return (
      <div key={sectionKey} className="mb-6 border border-gray-200 rounded-lg">
        <button
          type="button"
          onClick={() => toggleSection(sectionKey)}
          className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left rounded-t-lg section-header"
        >
          <span>{section.name}</span>
          {isCollapsed ? (
            <ChevronRightIcon className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {!isCollapsed && (
          <div className="p-4 bg-white rounded-b-lg">
            {section.fields?.map(field => renderField(field, unitId, sectionValues))}
          </div>
        )}
      </div>
    );
  };

  const renderUnit = (unit) => {
    const unitDisplayName = unit.designation || `Unit ${units.indexOf(unit) + 1}`;
    const unitKey = `unit-${unit.id}`;
    const isCollapsed = collapsedSections[unitKey];

    return (
      <div key={unit.id} className="mb-6 border-2 border-blue-200 rounded-lg">
        <div className="flex items-center justify-between px-4 py-3 bg-blue-50 hover:bg-blue-100">
          <button
            type="button"
            onClick={() => toggleSection(unitKey)}
            className="flex items-center justify-between w-full text-left font-medium text-blue-900"
          >
            <span>{unitDisplayName}</span>
            {isCollapsed ? (
              <ChevronRightIcon className="h-5 w-5 text-blue-500" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-blue-500" />
            )}
          </button>
          {units.length > 1 && (
            <button
              type="button"
              onClick={() => removeUnit(unit.id)}
              className="ml-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {!isCollapsed && (
          <div className="p-4 bg-white rounded-b-lg">
            {step.unitTemplate.fields ? 
              step.unitTemplate.fields.map(field => renderField(field, unit.id)) :
              step.unitTemplate.sections.map(section => renderSection(section, unit.id))
            }
          </div>
        )}
      </div>
    );
  };

  const renderFields = () => {
    if (step.allowMultipleUnits) {
      // Render multiple units
      return (
        <div className="space-y-4">
          {units.map(unit => renderUnit(unit))}
          <button
            type="button"
            onClick={addUnit}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 flex items-center justify-center text-gray-600 hover:text-gray-800"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Responding Unit
          </button>
        </div>
      );
    } else if (step.sections) {
      // Render fields organized by sections
      return step.sections.map(section => renderSection(section));
    } else {
      // Render fields directly (including fields of type 'section')
      return step.fields?.map(field => {
        return renderField(field);
      });
    }
  };

  const handleFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <form onSubmit={(e) => { e.preventDefault(); handleFormSubmit({}); }} className="space-y-6">
        {renderFields()}
        {/* Status Bar */}
        {lastFocusedField && (
          <div className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white p-2 text-sm border-t border-gray-600 z-50">
            <span className="font-medium">Field:</span> {lastFocusedField}
            {backingValues[lastFocusedField] && (
              <span className="ml-4"><span className="font-medium">Backing Value:</span> {backingValues[lastFocusedField]}</span>
            )}
          </div>
        )}
        <div className="flex justify-between space-x-4 pt-6 border-t mb-16">
          {showPrevious && (
            <button
              type="button"
              onClick={onPrevious}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
          )}
          <div className="flex-1"></div>
          {/* Show Submit button only on the second page */}
          {step && step.id === 'incident-record-control' && (
            <button
              type="submit"
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit
            </button>
          )}
          {/* Otherwise show Next */}
          {(!step || step.id !== 'incident-record-control') && (
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default FormStep;