import React, { useMemo } from 'react';

const ALPHABETS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z', '#'];

function AlphabetIndex({ onLetterClick, activeLetter, contactGroups }) {
  const availableLetters = useMemo(() => {
    if (!contactGroups || contactGroups.length === 0) return new Set();
    return new Set(contactGroups.map(g => g.letter));
  }, [contactGroups]);

  const handleClick = (letter) => {
    const element = document.getElementById(`letter-section-${letter}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    onLetterClick?.(letter);
  };

  return (
    <div className="alphabet-index">
      {ALPHABETS.map(letter => {
        const isAvailable = availableLetters.has(letter);
        return (
          <span
            key={letter}
            className={activeLetter === letter ? 'active' : ''}
            style={{
              opacity: isAvailable ? 1 : 0.3,
              cursor: isAvailable ? 'pointer' : 'default'
            }}
            onClick={() => isAvailable && handleClick(letter)}
          >
            {letter}
          </span>
        );
      })}
    </div>
  );
}

export default AlphabetIndex;
