import React, { useState } from 'react';
import CritiqueCard from './CritiqueCard';
import Icon from './Icon';
import './Inspector.css';

const categories = ['usability', 'accessibility', 'visual_hierarchy', 'interaction_design', 'consistency'];

const categoryIcons = {
  usability: 'user',
  accessibility: 'accessibility',
  visual_hierarchy: 'layout',
  interaction_design: 'pointer',
  consistency: 'layers'
};

const categoryLabels = {
  usability: 'Usability',
  accessibility: 'Accessibility',
  visual_hierarchy: 'Visual Hierarchy',
  interaction_design: 'Interaction Design',
  consistency: 'Consistency'
};

const severities = ['High', 'Medium', 'Low'];

const Inspector = ({
  critiqueData,
  onSelectCritique,
  selectedCritique,
  onChat,
  isLoading
}) => {
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

  const allIssues = Object.values(critiqueData).flat();
  const totalIssues = allIssues.length;
  const severityCounts = severities.reduce((acc, level) => {
    acc[level] = allIssues.filter((item) => item?.severity === level).length;
    return acc;
  }, {});

  const header = (
    <div className="inspector-header">
      <div className="inspector-title">
        <h2>Critique</h2>
        {totalIssues > 0 && !isLoading && (
          <span className="issues-count">{totalIssues} issues</span>
        )}
      </div>
      {totalIssues > 0 && !isLoading && (
        <>
          <div className="severity-bar" aria-hidden="true">
            {severities.map((level) =>
              severityCounts[level] > 0 ? (
                <span
                  key={level}
                  className={`severity-bar-segment sev-${level.toLowerCase()}`}
                  style={{ flexGrow: severityCounts[level] }}
                />
              ) : null
            )}
          </div>
          <div className="severity-summary">
            {severities.map((level) => (
              <span key={level} className={`severity-chip sev-${level.toLowerCase()}`}>
                <span className="severity-dot" />
                {severityCounts[level]} {level}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <aside className="inspector-panel">
        {header}
        <div className="inspector-content" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.12}s` }}>
              <div className="skeleton-line short" />
              <div className="skeleton-line" />
              <div className="skeleton-line medium" />
            </div>
          ))}
          <p className="loading-caption">Reviewing usability, accessibility, hierarchy…</p>
        </div>
      </aside>
    );
  }

  if (totalIssues === 0) {
    return (
      <aside className="inspector-panel">
        {header}
        <div className="empty-state">
          <div className="empty-icon">
            <Icon name="sparkles" size={24} />
          </div>
          <h3>No critique yet</h3>
          <p>Add a screenshot or some code, then click <strong>Analyze interface</strong>.</p>
          <ul className="empty-categories">
            {categories.map((category) => (
              <li key={category} style={{ '--cat': `var(--cat-${category})` }}>
                <Icon name={categoryIcons[category]} size={13} />
                {categoryLabels[category]}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    );
  }

  return (
    <aside className="inspector-panel">
      {header}

      <div className="inspector-content">
        {categories.map((category) => {
          const issues = Array.isArray(critiqueData?.[category]) ? critiqueData[category] : [];
          const isExpanded = expandedCategories[category];

          return (
            <section
              key={category}
              className="category-section"
              style={{ '--cat': `var(--cat-${category})` }}
            >
              <button
                className={`category-header ${isExpanded ? 'expanded' : ''}`}
                onClick={() => toggleCategory(category)}
                aria-expanded={isExpanded}
              >
                <span className="category-toggle">
                  <Icon name="chevron" size={14} />
                </span>
                <span className="category-icon">
                  <Icon name={categoryIcons[category]} size={14} />
                </span>
                <span className="category-name">{categoryLabels[category]}</span>
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
                        categoryIcon={<Icon name={categoryIcons[category]} size={13} />}
                        onSelect={() => onSelectCritique({ category, index, item })}
                        isSelected={
                          selectedCritique?.category === category &&
                          selectedCritique?.index === index
                        }
                        onChat={(data) => onChat({ ...data, category })}
                      />
                    ))
                  ) : (
                    <p className="category-empty">No issues returned in this category.</p>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </aside>
  );
};

export default Inspector;
