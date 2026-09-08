import { createTheme } from "@mui/material/styles";

export const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: "class",
  },

  gradients: {
    light: {
      profileHero: "linear-gradient(135deg, #dcfce7 0%, #ffffff 60%)",
    },
    dark: {
      profileHero:
        "linear-gradient(135deg, #052e16 0%, #1a1c1a 58%, #111211 100%)",
    },
  },

  layout: {
    light: {
      drawerBackground: "#111211",
      drawerHover: "#1a1a1a",
    },
    dark: {
      drawerBackground: "#0d0e0d",
      drawerHover: "#181a18",
    },
  },

  colorSchemes: {
    light: {
      palette: {
        primary: {
          main: "#3d7e32",
          dark: "#166534",
          light: "#dcfce7",
          contrastText: "#ffffff",
        },

        background: {
          default: "#f7f8f6",
          paper: "#ffffff",
        },

        text: {
          primary: "#111211",
          secondary: "#626e66",
        },

        divider: "#e4e6e3",

        grey: {
          50: "#f7f8f6",
          100: "#f0f2ef",
          200: "#e9ebe8",
          300: "#e4e6e3",
          500: "#7a8078",
          900: "#111211",
          A100: "#fff",
          A200: "#000",
        },

        success: {
          main: "#3d7e32",
          dark: "#166534",
          light: "#dcfce7",
          contrastText: "#ffffff",
        },

        muted: {
          main: "#2c3330",
        },

        // Semantic status colors
        yellow: {
          main: "#fef9c3",
          sub: "#854d0e",
        },

        green: {
          main: "#dcfce7",
          sub: "#15803d",
        },

        blue: {
          main: "#dbeafe",
          sub: "#1e40af",
        },

        red: {
          main: "#fee2e2",
          sub: "#991b1b",
        },
      },
    },

    dark: {
      palette: {
        primary: {
          main: "#c5f57a",
          dark: "#166534",
          light: "#dcfce7",
          contrastText: "#14221a",
        },

        background: {
          default: "#111211",
          paper: "#1a1c1a",
        },

        text: {
          primary: "#f7f8f6",
          secondary: "#a7ada5",
        },

        divider: "#30332f",

        grey: {
          50: "#111211",
          100: "#1a1c1a",
          200: "#242724",
          300: "#30332f",
          500: "#a7ada5",
          900: "#f7f8f6",
          A100: "#000",
          A200: "#fff",
        },

        success: {
          main: "#c5f57a",
          dark: "#166534",
          light: "#dcfce7",
          contrastText: "#14221a",
        },

        muted: {
          main: "#d1d5d2",
        },

        // Semantic status colors
        yellow: {
          main: "#422006",
          sub: "#fde68a",
        },

        green: {
          main: "#052e16",
          sub: "#86efac",
        },

        blue: {
          main: "#172554",
          sub: "#93c5fd",
        },

        red: {
          main: "#450a0a",
          sub: "#fca5a5",
        },
      },
    },
  },

  typography: {
    fontFamily: `"Inter", "Arial", sans-serif`,

    h1: {
      fontWeight: 700,
    },

    h2: {
      fontWeight: 700,
    },

    h3: {
      fontWeight: 700,
    },

    h4: {
      fontWeight: 600,
    },

    h5: {
      fontWeight: 600,
    },

    h6: {
      fontWeight: 600,
    },

    button: {
      fontWeight: 600,
      textTransform: "none",
    },
  },

  shape: {
    borderRadius: 10,

    rounded: {
      square: 1,
      light: 2,
      medium: 3,
      circle: 10,
    },
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          boxShadow: "none",
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 14,
          border: `1px solid ${theme.vars.palette.divider}`,
          boxShadow: "none",
          backgroundColor: theme.vars.palette.background.paper,
        }),
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        variant: "outlined",
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 10,
          backgroundColor: theme.vars.palette.background.paper,

          "& fieldset": {
            borderColor: theme.vars.palette.divider,
          },

          "&:hover fieldset": {
            borderColor: theme.vars.palette.text.secondary,
          },

          "&.Mui-focused fieldset": {
            borderColor: theme.vars.palette.primary.main,
          },
        }),
      },
    },

    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          backgroundColor: theme.layout[theme.palette.mode].drawerBackground,
          borderRight: `1px solid ${theme.vars.palette.divider}`,
        }),
      },
    },

    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.vars.palette.background.paper,
          borderBottom: `1px solid ${theme.vars.palette.divider}`,
        }),
      },
    },

    MuiListItemButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          "&:hover": {
            backgroundColor: theme.layout[theme.palette.mode].drawerHover,
          },
        }),
      },
    },

    MuiDivider: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderColor: theme.vars.palette.divider,
        }),
      },
    },
  },
});
