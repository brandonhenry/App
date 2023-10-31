import React, {useMemo} from 'react';
import styles from './styles';
import useTheme from './themes/useTheme';
import ThemeStylesContext from './ThemeStylesContext';

type ThemeStylesProviderProps = {
    children: React.ReactNode;
};

function ThemeStylesProvider({children}: ThemeStylesProviderProps) {
    const theme = useTheme();
    const themeStyles = useMemo(() => styles(theme), [theme]);
    return <ThemeStylesContext.Provider value={themeStyles}>{children}</ThemeStylesContext.Provider>;
}

ThemeStylesProvider.displayName = 'ThemeStylesProvider';

export default ThemeStylesProvider;
