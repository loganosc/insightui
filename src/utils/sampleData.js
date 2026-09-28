// Sample critique data for testing/demo purposes
// This shows what the Ollama response looks like for a typical e-commerce login page

export const sampleCritiqueData = {
  "usability": [
    {
      "issue": "Form error messages appear in small gray text below fields, making them easy to miss.",
      "element": "Error message text",
      "fix": "Use bold, large red text (minimum 14px) positioned above the field with an alert icon. Add gentle red background highlight to the input field.",
      "severity": "High"
    },
    {
      "issue": "The 'Remember me' checkbox label is difficult to read at small sizes.",
      "element": "Checkbox label",
      "fix": "Increase checkbox size to at least 18x18px and label to 13px. Ensure adequate padding between checkbox and label.",
      "severity": "Medium"
    },
    {
      "issue": "Submit button color is the same as the background in some states, causing confusion.",
      "element": "Login button",
      "fix": "Use distinct color for primary action button (at least 4.5:1 contrast). Add hover state with darker background or shadow.",
      "severity": "High"
    }
  ],
  "accessibility": [
    {
      "issue": "Email input field has no associated label, making it unclear for screen reader users.",
      "element": "Email input field",
      "fix": "Add <label for=\"email\">Email Address</label> or use aria-label=\"Email Address\" on the input.",
      "severity": "High"
    },
    {
      "issue": "Color contrast ratio between text and background is 2.5:1, below WCAG AA standard of 4.5:1.",
      "element": "Placeholder text",
      "fix": "Use darker placeholder color or lighter background. Aim for minimum 4.5:1 ratio for normal text, 3:1 for large text.",
      "severity": "High"
    },
    {
      "issue": "Focus indicators on form fields are not visible when using keyboard navigation.",
      "element": "Form inputs",
      "fix": "Add visible focus state: outline: 2px solid #0066cc; outline-offset: 2px;",
      "severity": "High"
    },
    {
      "issue": "Links are underlined but buttons are not, making it hard to distinguish interactive elements.",
      "element": "Button and link styles",
      "fix": "Use consistent indicators for all interactive elements. Underline links, raise buttons with shadow, or use icons.",
      "severity": "Medium"
    }
  ],
  "visual_hierarchy": [
    {
      "issue": "The 'Forgot password?' link has the same visual weight as the main login button, causing confusion.",
      "element": "Forgot password link",
      "fix": "Make the link smaller (12px vs 16px button) and lighter in color (gray rather than blue). Position it subtly below the form.",
      "severity": "Medium"
    },
    {
      "issue": "No clear heading explaining the purpose of this page. User must infer it's a login form.",
      "element": "Page title",
      "fix": "Add prominent heading: 'Sign In to Your Account' (24px, bold) at the top of the card.",
      "severity": "Low"
    },
    {
      "issue": "Form fields and labels have minimal spacing, making the form feel cramped.",
      "element": "Form spacing",
      "fix": "Increase vertical spacing between fields to at least 16px. Add 4px space between label and input.",
      "severity": "Low"
    }
  ],
  "interaction_design": [
    {
      "issue": "No success feedback shown after clicking login - user doesn't know if submission succeeded.",
      "element": "Login button",
      "fix": "Show loading spinner in button with text 'Signing in...' or disable button with opacity change during submission.",
      "severity": "High"
    },
    {
      "issue": "Password shows/hide toggle lacks clear iconography - unclear what button does.",
      "element": "Password visibility toggle",
      "fix": "Use standard eye icon (👁️) for 'show' and crossed-eye (🚫) for 'hide'. Add tooltip on hover.",
      "severity": "Medium"
    },
    {
      "issue": "Form submission doesn't provide any indication of why it might fail (slow network, server error, etc).",
      "element": "Form submission",
      "fix": "Show error toast notification with specific message: 'Invalid email or password' instead of generic error.",
      "severity": "High"
    }
  ],
  "consistency": [
    {
      "issue": "Button radius is 4px but card radius is 8px, breaking the design system rhythm.",
      "element": "Button and card borders",
      "fix": "Use single border-radius value across all components: 8px. Update all buttons to match.",
      "severity": "Low"
    },
    {
      "issue": "The success message uses green (#2ecc71) but the design system defines primary green as #10b981.",
      "element": "Success message color",
      "fix": "Replace all color values with design system tokens. Use --color-success: #10b981;",
      "severity": "Medium"
    },
    {
      "issue": "Font sizes are inconsistent: labels are 13px, some headings are 18px, others are 20px.",
      "element": "Typography",
      "fix": "Establish type scale: body: 14px, label: 12px, heading: 18px, title: 24px. Use CSS variables.",
      "severity": "Medium"
    }
  ]
};

// Mock image for testing
export const sampleScreenshotUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iI2Y5ZmFmYiIvPjxyZWN0IHg9IjUwIiB5PSI1MCIgd2lkdGg9IjMwMCIgaGVpZ2h0PSI1MDAiIHJ4PSI4IiBmaWxsPSJ3aGl0ZSIgc3Ryb2tlPSIjZTBlN2ViIiBzdHJva2Utd2lkdGg9IjEiLz48dGV4dCB4PSIyMDAiIHk9IjEwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1zaXplPSIyMiIgZm9udC13ZWlnaHQ9ImJvbGQiIHg9IjIwMCIgZmlsbD0iIzMzMyI+U2lnbiBJbjwvdGV4dD48cmVjdCB4PSI3MCIgeT0iMTQwIiB3aWR0aD0iMjYwIiBoZWlnaHQ9IjQwIiByeD0iNCIgZmlsbD0iI2Y5ZmFmYiIgc3Ryb2tlPSIjZTBlN2ViIiBzdHJva2Utd2lkdGg9IjEiLz48dGV4dCB4PSI3MCIgeT0iMTMwIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjY2Ij5FbWFpbCBBZGRyZXNzPC90ZXh0PjxyZWN0IHg9IjcwIiB5PSIyMjAiIHdpZHRoPSIyNjAiIGhlaWdodD0iNDAiIHJ4PSI0IiBmaWxsPSIjZjlmYWZiIiBzdHJva2U9IiNlMGU3ZWIiIHN0cm9rZS13aWR0aD0iMSIvPjx0ZXh0IHg9IjcwIiB5PSIyMTAiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM2NjYiPlBhc3N3b3JkPC90ZXh0PjxyZWN0IHg9IjcwIiB5PSIzMTAiIHdpZHRoPSIyNjAiIGhlaWdodD0iNDgiIHJ4PSI0IiBmaWxsPSIjNjY3ZWVhIi8+PHRleHQgeD0iMjAwIiB5PSIzNDEiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtc2l6ZT0iMTYiIGZvbnQtd2VpZ2h0PSJib2xkIiBmaWxsPSJ3aGl0ZSI+U2lnbiBJbjwvdGV4dD48dGV4dCB4PSI3MCIgeT0iMzgyIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjY3ZWVhIj5Gb3Jnb3Qgd/+YHwvdGV4dD48L3N2Zz4=';
