/**
 * Custom validation messages dalam Bahasa Indonesia
 * Untuk mengganti pesan default "Please fill out this field" 
 */

export const validationMessages = {
  email: {
    required: 'Email harus diisi',
    invalid: 'Format email tidak valid',
  },
  password: {
    required: 'Password harus diisi',
    tooShort: 'Password minimal 8 karakter',
  },
  text: (fieldName: string) => ({
    required: `${fieldName} harus diisi`,
    tooShort: `${fieldName} terlalu pendek`,
    tooLong: `${fieldName} terlalu panjang`,
  }),
  number: (fieldName: string) => ({
    required: `${fieldName} harus diisi`,
    invalid: `${fieldName} harus berupa angka`,
    tooSmall: `${fieldName} terlalu kecil`,
    tooBig: `${fieldName} terlalu besar`,
  }),
  select: (fieldName: string) => ({
    required: `${fieldName} harus dipilih`,
  }),
  textarea: (fieldName: string) => ({
    required: `${fieldName} harus diisi`,
  }),
  date: {
    required: 'Tanggal harus diisi',
    invalid: 'Format tanggal tidak valid',
  },
  file: {
    required: 'File harus dipilih',
  },
};

/**
 * Handler untuk custom validation message pada Input email
 */
export const handleEmailValidation = (e: React.InvalidEvent<HTMLInputElement>) => {
  e.preventDefault();
  const target = e.target;
  if (target.validity.valueMissing) {
    target.setCustomValidity(validationMessages.email.required);
  } else if (target.validity.typeMismatch) {
    target.setCustomValidity(validationMessages.email.invalid);
  }
};

/**
 * Handler untuk custom validation message pada Input password
 */
export const handlePasswordValidation = (e: React.InvalidEvent<HTMLInputElement>) => {
  e.preventDefault();
  const target = e.target;
  if (target.validity.valueMissing) {
    target.setCustomValidity(validationMessages.password.required);
  } else if (target.validity.tooShort) {
    target.setCustomValidity(validationMessages.password.tooShort);
  }
};

/**
 * Handler untuk custom validation message pada Input text
 */
export const handleTextValidation = (fieldName: string) => {
  return (e: React.InvalidEvent<HTMLInputElement>) => {
    e.preventDefault();
    const target = e.target;
    const messages = validationMessages.text(fieldName);
    
    if (target.validity.valueMissing) {
      target.setCustomValidity(messages.required);
    } else if (target.validity.tooShort) {
      target.setCustomValidity(messages.tooShort);
    } else if (target.validity.tooLong) {
      target.setCustomValidity(messages.tooLong);
    }
  };
};

/**
 * Handler untuk custom validation message pada Input number
 */
export const handleNumberValidation = (fieldName: string) => {
  return (e: React.InvalidEvent<HTMLInputElement>) => {
    e.preventDefault();
    const target = e.target;
    const messages = validationMessages.number(fieldName);
    
    if (target.validity.valueMissing) {
      target.setCustomValidity(messages.required);
    } else if (target.validity.badInput) {
      target.setCustomValidity(messages.invalid);
    } else if (target.validity.rangeUnderflow) {
      target.setCustomValidity(messages.tooSmall);
    } else if (target.validity.rangeOverflow) {
      target.setCustomValidity(messages.tooBig);
    }
  };
};

/**
 * Handler untuk custom validation message pada Select
 */
export const handleSelectValidation = (fieldName: string) => {
  return (e: React.InvalidEvent<HTMLSelectElement>) => {
    e.preventDefault();
    const target = e.target;
    const messages = validationMessages.select(fieldName);
    
    if (target.validity.valueMissing) {
      target.setCustomValidity(messages.required);
    }
  };
};

/**
 * Handler untuk custom validation message pada Textarea
 */
export const handleTextareaValidation = (fieldName: string) => {
  return (e: React.InvalidEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const target = e.target;
    const messages = validationMessages.textarea(fieldName);
    
    if (target.validity.valueMissing) {
      target.setCustomValidity(messages.required);
    }
  };
};

/**
 * Handler untuk custom validation message pada Input date
 */
export const handleDateValidation = (e: React.InvalidEvent<HTMLInputElement>) => {
  e.preventDefault();
  const target = e.target;
  if (target.validity.valueMissing) {
    target.setCustomValidity(validationMessages.date.required);
  } else if (target.validity.badInput) {
    target.setCustomValidity(validationMessages.date.invalid);
  }
};

/**
 * Handler untuk custom validation message pada Input file
 */
export const handleFileValidation = (e: React.InvalidEvent<HTMLInputElement>) => {
  e.preventDefault();
  const target = e.target;
  if (target.validity.valueMissing) {
    target.setCustomValidity(validationMessages.file.required);
  }
};

/**
 * Handler untuk reset custom validation message
 * Digunakan pada onInput/onChange
 */
export const resetValidation = (e: React.FormEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
  const target = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  target.setCustomValidity('');
};
