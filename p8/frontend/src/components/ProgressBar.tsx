import React, { useState, useEffect, useRef } from 'react';

interface ProgressBarProps {
  text: string;
  votes: number;
  percentage: number;
  color: string;
  totalVotes: number;
  showVotes?: boolean;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  text,
  votes,
  percentage,
  color,
  totalVotes,
  showVotes = true
}) => {
  const [displayPercentage, setDisplayPercentage] = useState(0);
  const [displayVotes, setDisplayVotes] = useState(0);
  const prevPercentageRef = useRef(0);
  const prevVotesRef = useRef(0);

  useEffect(() => {
    const startPercentage = prevPercentageRef.current;
    const endPercentage = percentage;
    const startVotes = prevVotesRef.current;
    const endVotes = votes;
    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      const currentPercentage = startPercentage + (endPercentage - startPercentage) * easeProgress;
      const currentVotes = startVotes + (endVotes - startVotes) * easeProgress;

      setDisplayPercentage(currentPercentage);
      setDisplayVotes(Math.round(currentVotes));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        prevPercentageRef.current = endPercentage;
        prevVotesRef.current = endVotes;
      }
    };

    requestAnimationFrame(animate);
  }, [percentage, votes]);

  return (
    <div className="progress-bar-item">
      <div className="progress-bar-header">
        <span className="progress-bar-text">{text}</span>
        {showVotes && (
          <span className="progress-bar-votes">
            {displayVotes}票 ({displayPercentage.toFixed(1)}%)
          </span>
        )}
      </div>
      <div className="progress-bar-track">
        <div
          className="progress-bar-fill"
          style={{
            width: `${displayPercentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
