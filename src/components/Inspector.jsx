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
        <h2 id="critique-heading">Critique</h2>
        <span className="issues-count" role="status">
          {totalIssues > 0 && !isLoading
            ? `${totalIssues} ${totalIssues === 1 ? 'issue' : 'issues'}`
            : ''}
        </span>
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
          <div className="severity-summary" role="group" aria-label="Issues by severity">
            {severities.map((level) => (
              <span key={level} className={`severity-chip sev-${level.toLowerCase()}`}>
                <span className="severity-dot" aria-hidden="true" />
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
      <section className="inspector-panel" aria-labelledby="critique-heading">
        {header}
        <div className="inspector-content" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.12}s` }}>
              <div className="skeleton-line short" aria-hidden="true" />
              <div className="skeleton-line" />
              <div className="skeleton-line medium" />
            </div>
          ))}
          <p className="loading-caption">Reviewing usability, accessibility, hierarchy…</p>
        </div>
      </section>
    );
  }

  if (totalIssues === 0) {
    return (
      <section className="inspector-panel" aria-labelledby="critique-heading">
        {header}
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">
            <Icon name="sparkles" size={26} />
          </div>
          <h3>No critique yet</h3>
          <p>Add a screenshot or some code, then click <strong>Analyze interface</strong>.</p>
          <ul className="empty-categories" aria-label="Categories reviewed">
            {categories.map((category) => (
              <li key={category} style={{ '--cat': `var(--cat-${category})` }}>
                <Icon name={categoryIcons[category]} size={16} />
                {categoryLabels[category]}
              </li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section className="inspector-panel" aria-labelledby="critique-heading">
      {header}

      <div className="inspector-content">
        {categories.map((category) => {
          const issues = Array.isArray(critiqueData?.[category]) ? critiqueData[category] : [];
          const isExpanded = expandedCategories[category];
          const panelId = `category-panel-${category}`;

          return (
            <section
              key={category}
              className="category-section"
              style={{ '--cat': `var(--cat-${category})` }}
            >
              <h3 className="category-heading">
                <button
                  type="button"
                  className={`category-header ${isExpanded ? 'expanded' : ''}`}
                  onClick={() => toggleCategory(category)}
                  aria-expanded={isExpanded}
                  aria-controls={panelId}
                >
                  <span className="category-toggle" aria-hidden="true">
                    <Icon name="chevron" size={16} />
                  </span>
                  <span className="category-icon" aria-hidden="true">
                    <Icon name={categoryIcons[category]} size={16} />
                  </span>
                  <span className="category-name">{categoryLabels[category]}</span>
                  <span className="category-count">
                    {issues.length}
                    <span className="visually-hidden"> {issues.length === 1 ? 'issue' : 'issues'}</span>
                  </span>
                </button>
              </h3>

              {isExpanded && (
                <div className="category-items" id={panelId}>
                  {issues.length > 0 ? (
                    issues.map((item, index) => (
                      <CritiqueCard
                        key={`${category}-${index}`}
                        issue={item.issue}
                        element={item.element}
                        fix={item.fix}
                        severity={item.severity}
                        categoryIcon={<Icon name={categoryIcons[category]} size={16} />}
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
    </section>
  );
};

export default Inspector;
