import React, { useState } from 'react';
import CritiqueCard from './CritiqueCard';
import './Inspector.css';

const Inspector = ({
  critiqueData,
  onSelectCritique,
  selectedCritique,
  onChat,
  isLoading
}) => {
  const categories = ['usability', 'accessibility', 'visual_hierarchy', 'interaction_design', 'consistency'];

  const [expandedCategories, setExpandedCategories] = useState({
    usability: true,
    accessibility: true,
    visual_hierarchy: true,
    interaction_design: true,
    consistency: true
  });

  const toggleCategory = (category) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const categoryIcons = {
    usability: '👤',
    accessibility: '♿',
    visual_hierarchy: '📐',
    interaction_design: '🎯',
    consistency: '✓'
  };

  const categoryLabels = {
    usability: 'Usability',
    accessibility: 'Accessibility',
    visual_hierarchy: 'Visual Hierarchy',
    interaction_design: 'Interaction Design',
    consistency: 'Consistency'
  };

  const totalIssues = Object.values(critiqueData).flat().length;

  if (isLoading){
    return (
      <div className="inspector-panel">
        <div className="inspector-header">
          <h2>Critique Inspector</h2>
        </div>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading analysis...</p>
        </div>
      </div>
    );
  }

  if (totalIssues === 0) {
    return (
      <div className="inspector-panel">
        <div className="inspector-header">
          <h2>Critique Inspector</h2>
        </div>
        <div className="empty-state">
          <div className="empty-icon">✨</div>
          <p>Add interface input and click Analyze Interface to see critique feedback</p>
        </div>
      </div>
    );
  }

  return (
    <div className="inspector-panel">
      <div className="inspector-header">
        <h2>Critique Inspector</h2>
        <span className="issues-count">{totalIssues} issues</span>
      </div>

      <div className="inspector-content">
        {categories.map((category) => {
          const issues = Array.isArray(critiqueData?.[category]) ? critiqueData[category] : [];
          const isExpanded = expandedCategories[category];

          return (
            <div key={category} className="category-section">
              <button
                className="category-header"
                onClick={() => toggleCategory(category)}
              >
                <span className="category-toggle">{isExpanded ? '▼' : '▶'}</span>
                <span className="category-icon">{categoryIcons[category]}</span>
                <span className="category-name">
                  {categoryLabels[category]}
                </span>
                <span className="category-count">{issues.length}</span>
              </button>

              {isExpanded && (
                <div className="category-items">
                  {issues.length > 0 ? (
                    issues.map((item, index) => (
                      <CritiqueCard
                        key={`${category}-${index}`}
                        issue={item.issue}
                        element={item.element}
                        fix={item.fix}
                        severity={item.severity}
                        categoryIcon={categoryIcons[category]}
                        onSelect={() => onSelectCritique({ category, index, item })}
                        isSelected={
                          selectedCritique?.category === category &&
                          selectedCritique?.index === index
                        }
                        onChat={(data) => onChat({ ...data, category })}
                      />
                    ))
                  ) : (
                    <p className="issue-text">No issues returned in this category.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Inspector;
