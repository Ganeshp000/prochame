import React from 'react';

export default function MessageBubble({ message }) {
  const { role, text, isStreaming } = message;

  const parseMarkdown = (rawText) => {
    if (!rawText) return null;
    const lines = rawText.split('\n');
    let elements = [];
    let inCodeBlock = false;
    let codeContent = [];
    let listItems = [];

    const flushCodeBlock = (key) => {
      if (codeContent.length > 0) {
        elements.push(
          <pre key={`code-${key}`} className="bubble-code-block">
            <code>{codeContent.join('\n')}</code>
          </pre>
        );
        codeContent = [];
      }
    };

    const flushList = (key) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`list-${key}`} className="bubble-list">
            {listItems.map((item, idx) => (
              <li key={`li-${idx}`}>{item}</li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    lines.forEach((line, index) => {
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          flushCodeBlock(index);
          inCodeBlock = false;
        } else {
          flushList(index);
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return;
      }

      if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
        const itemText = line.replace(/^[\s-*]+/, '');
        listItems.push(renderInlineMarkdown(itemText));
        return;
      } else {
        flushList(index);
      }

      if (line.trim() === '') {
        return;
      }

      elements.push(
        <p key={`p-${index}`} className="bubble-paragraph">
          {renderInlineMarkdown(line)}
        </p>
      );
    });

    flushCodeBlock(lines.length);
    flushList(lines.length);
    return elements;
  };

  const renderInlineMarkdown = (lineText) => {
    const tokens = [];
    let remaining = lineText;
    let keyIdx = 0;

    while (remaining.length > 0) {
      const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
      const codeMatch = remaining.match(/`([^`]+)`/);

      let firstMatch = null;
      let matchType = '';

      if (boldMatch && codeMatch) {
        if (boldMatch.index < codeMatch.index) {
          firstMatch = boldMatch;
          matchType = 'bold';
        } else {
          firstMatch = codeMatch;
          matchType = 'code';
        }
      } else if (boldMatch) {
        firstMatch = boldMatch;
        matchType = 'bold';
      } else if (codeMatch) {
        firstMatch = codeMatch;
        matchType = 'code';
      }

      if (firstMatch) {
        if (firstMatch.index > 0) {
          tokens.push(<span key={`text-${keyIdx++}`}>{remaining.slice(0, firstMatch.index)}</span>);
        }

        if (matchType === 'bold') {
          tokens.push(<strong key={`bold-${keyIdx++}`} className="bubble-bold">{firstMatch[1]}</strong>);
        } else if (matchType === 'code') {
          tokens.push(<code key={`code-${keyIdx++}`} className="bubble-inline-code">{firstMatch[1]}</code>);
        }

        remaining = remaining.slice(firstMatch.index + firstMatch[0].length);
      } else {
        tokens.push(<span key={`text-${keyIdx++}`}>{remaining}</span>);
        remaining = '';
      }
    }

    return tokens;
  };

  return (
    <div className={`message-bubble-wrapper ${role === 'user' ? 'user-align' : 'assistant-align'}`}>
      <div className={`message-bubble ${role === 'user' ? 'user-bg' : 'assistant-bg'}`}>
        {parseMarkdown(text)}
        {isStreaming && <span className="bubble-caret"></span>}
      </div>
    </div>
  );
}
