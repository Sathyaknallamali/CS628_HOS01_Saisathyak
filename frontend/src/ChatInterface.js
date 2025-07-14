import React, { useState } from 'react';

function ChatInterface() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/chat';

  const handleTextChange = (e) => {
    setInputText(e.target.value);
  };

  const handleSubmit = async () => {
    if (inputText.trim()) {
      setIsLoading(true);
      setResult('');

      try {
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: inputText }),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let done = false;
        let accumulatedResult = '';

        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          const chunk = decoder.decode(value, { stream: true });

          const lines = chunk.split('\n');

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('data:')) {
              try {
                const parsedData = JSON.parse(line.replace('data: ', ''));

                if (parsedData.response) {
                  accumulatedResult += parsedData.response;
                  setResult(accumulatedResult);
                }

                if (parsedData.done) {
                  setIsLoading(false);
                }
              } catch (err) {
                console.error('Error parsing JSON chunk:', err);
              }
            }
          }
        }

      } catch (error) {
        console.error('Error during streaming:', error);
        setIsLoading(false);
      }
    }
  };

  return (
    <div>
      <h1>Chat with Gemma 2:2b</h1>

      <div>
        <textarea
          value={inputText}
          onChange={handleTextChange}
          placeholder="Type your message here..."
          rows="5"
          cols="50"
        />
      </div>

      <button onClick={handleSubmit} disabled={isLoading}>
        {isLoading ? 'Waiting for response...' : 'Send'}
      </button>

      <div>
        <h2>Response:</h2>
        <p>{result}</p>
      </div>
    </div>
  );
}

export default ChatInterface;
