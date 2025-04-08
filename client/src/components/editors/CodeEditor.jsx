import React, { useState } from 'react';
import { Box, TextField, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const CODE_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'sql', label: 'SQL' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'bash', label: 'Bash/Shell' },
  { value: 'plaintext', label: 'Plain Text' }
];

function CodeEditor({ content, setContent }) {
  const [language, setLanguage] = useState('javascript');

  // Extract language from content if it exists in a specific format
  // This could be enhanced to parse more sophisticated formats
  React.useEffect(() => {
    const match = content?.match(/^```(\w+)/);
    if (match && match[1]) {
      const lang = match[1].toLowerCase();
      const isValidLang = CODE_LANGUAGES.some(l => l.value === lang);
      if (isValidLang) {
        setLanguage(lang);
      }
    }
  }, []);

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'auto',
    }}>
      <Box sx={{ p: 2 }}>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="code-language-label">Language</InputLabel>
          <Select
            labelId="code-language-label"
            id="code-language"
            value={language}
            onChange={handleLanguageChange}
            label="Language"
          >
            {CODE_LANGUAGES.map((lang) => (
              <MenuItem key={lang.value} value={lang.value}>
                {lang.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TextField
        placeholder="// Write your code here"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        multiline
        fullWidth
        variant="outlined"
        InputProps={{
          sx: {
            fontFamily: '"Roboto Mono", monospace',
            fontSize: '0.9rem',
            whiteSpace: 'pre-wrap',
          }
        }}
        sx={{
          flex: '1 0 auto',
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            backgroundColor: (theme) =>
              theme.palette.mode === 'dark' ? '#1e1e1e' : '#f5f5f5',
            '& fieldset': {
              border: 'none'
            }
          },
          '& .MuiInputBase-input': {
            padding: 2,
            lineHeight: 1.5,
            '&::placeholder': {
              color: 'text.secondary',
              opacity: 0.7,
            },
          },
        }}
      />
    </Box>
  );
}

export default CodeEditor;