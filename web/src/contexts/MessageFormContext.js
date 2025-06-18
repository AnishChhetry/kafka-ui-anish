import React, { useState, useCallback, useRef, useMemo } from 'react';

export const MessageFormContext = React.createContext(null);

export const MessageFormProvider = ({ children }) => {
  const [formData, setFormData] = useState({
    key: '',
    value: '',
    headers: [{ key: '', value: '' }],
    partition: -1
  });

  const formRef = useRef(formData);
  formRef.current = formData;

  const handleKeyChange = useCallback((e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, key: value }));
  }, []);

  const handlePartitionChange = useCallback((e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, partition: value }));
  }, []);

  const handleValueChange = useCallback((e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, value: value }));
  }, []);

  const handleHeaderChange = useCallback((index, field, value) => {
    setFormData(prev => {
      const newHeaders = [...prev.headers];
      newHeaders[index] = { ...newHeaders[index], [field]: value };
      return { ...prev, headers: newHeaders };
    });
  }, []);

  const addHeader = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      headers: [...prev.headers, { key: '', value: '' }]
    }));
  }, []);

  const removeHeader = useCallback((index) => {
    setFormData(prev => ({
      ...prev,
      headers: prev.headers.filter((_, i) => i !== index)
    }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({
      key: '',
      value: '',
      headers: [{ key: '', value: '' }],
      partition: -1
    });
  }, []);

  const value = useMemo(() => ({
    formData,
    handleKeyChange,
    handlePartitionChange,
    handleValueChange,
    handleHeaderChange,
    addHeader,
    removeHeader,
    resetForm,
    formRef,
    setFormData
  }), [formData, handleKeyChange, handlePartitionChange, handleValueChange, 
      handleHeaderChange, addHeader, removeHeader, resetForm, setFormData]);

  return (
    <MessageFormContext.Provider value={value}>
      {children}
    </MessageFormContext.Provider>
  );
}; 