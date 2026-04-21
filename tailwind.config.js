tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            "colors": {
                "on-primary-container": "#003e58",
                "error-container": "#93000a",
                "tertiary": "#f1c100",
                "surface-container-highest": "#353534",
                "on-tertiary-fixed": "#241a00",
                "error": "#ffb4ab",
                "surface-tint": "#82cfff",
                "surface-container-high": "#2a2a2a",
                "surface-dim": "#131313",
                "primary-fixed-dim": "#82cfff",
                "surface-container": "#201f1f",
                "surface-variant": "#353534",
                "on-secondary-container": "#aab6cc",
                "background": "#131313",
                "inverse-surface": "#e5e2e1",
                "secondary-container": "#3c475a",
                "on-surface-variant": "#bdc8d1",
                "on-tertiary-fixed-variant": "#584400",
                "on-secondary-fixed-variant": "#3c475a",
                "surface-container-lowest": "#0e0e0e",
                "primary": "#82cfff",
                "tertiary-fixed-dim": "#f1c100",
                "on-primary": "#00344b",
                "primary-container": "#00aeef",
                "outline-variant": "#3e4850",
                "secondary": "#bcc7dd",
                "on-tertiary": "#3d2f00",
                "outline": "#87929b",
                "tertiary-container": "#c69e00",
                "secondary-fixed-dim": "#bcc7dd",
                "on-surface": "#e5e2e1",
                "inverse-primary": "#00658d",
                "on-error-container": "#ffdad6",
                "on-secondary-fixed": "#111c2c",
                "on-background": "#e5e2e1",
                "on-error": "#690005",
                "secondary-fixed": "#d8e3fa",
                "surface-bright": "#393939",
                "on-primary-fixed-variant": "#004c6b",
                "on-tertiary-container": "#473700",
                "primary-fixed": "#c6e7ff",
                "tertiary-fixed": "#ffe08b",
                "on-secondary": "#263142",
                "on-primary-fixed": "#001e2d",
                "surface-container-low": "#1c1b1b",
                "inverse-on-surface": "#313030",
                "surface": "#131313"
            },
            "borderRadius": {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "full": "9999px"
            },
            "spacing": {
                "panel-padding": "12px",
                "unit": "4px",
                "gutter": "16px",
                "margin": "24px",
                "grid-size": "32px"
            },
            "fontFamily": {
                "headline-lg": ["Space Grotesk"],
                "label-caps": ["Inter"],
                "data-mono": ["Inter"],
                "headline-md": ["Space Grotesk"],
                "body-sm": ["Inter"]
            },
            "fontSize": {
                "headline-lg": ["24px", { "lineHeight": "32px", "letterSpacing": "0.05em", "fontWeight": "600" }],
                "label-caps": ["10px", { "lineHeight": "12px", "letterSpacing": "0.1em", "fontWeight": "700" }],
                "data-mono": ["12px", { "lineHeight": "16px", "letterSpacing": "0.01em", "fontWeight": "500" }],
                "headline-md": ["18px", { "lineHeight": "24px", "letterSpacing": "0.02em", "fontWeight": "500" }],
                "body-sm": ["14px", { "lineHeight": "20px", "fontWeight": "400" }]
            }
        }
    }
};
