# Universal Theme System for Mobile App

## 🎯 **Overview**
This universal theme system provides a consistent, maintainable way to implement dark/light themes across all mobile app pages without duplicating code.

## 🚀 **How to Use in Any Page**

### 1. **Import the Universal System**
```typescript
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '../constants/Colors';
import { createThemeStyles } from '../styles/universalStyles';
```

### 2. **Get Current Theme Colors**
```typescript
const { resolvedTheme } = useTheme();
const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;
```

### 3. **Create Universal Styles**
```typescript
// Universal styles (container, text, buttons, etc.)
const universalStyles = createThemeStyles(currentColors);

// Page-specific styles (only what's unique to this page)
const styles = StyleSheet.create({
  customElement: {
    // Only define styles that aren't in universalStyles
    specificProperty: 'value',
  },
});
```

### 4. **Use in JSX**
```typescript
return (
  <SafeAreaView style={universalStyles.container}>
    <ScrollView style={universalStyles.scrollView}>
      <View style={universalStyles.section}>
        <Text style={universalStyles.sectionTitle}>Title</Text>
        <Text style={universalStyles.bodyText}>Content</Text>
      </View>
      
      <TouchableOpacity style={universalStyles.button}>
        <Text style={universalStyles.buttonText}>Button</Text>
      </TouchableOpacity>
    </ScrollView>
  </SafeAreaView>
);
```

## 🎨 **Available Universal Styles**

### **Layout**
- `container` - Main page container
- `scrollView` - Scrollable content area
- `card` - Card with borders and padding
- `section` - Section with top/bottom borders

### **Text**
- `title` - Large title (24px, bold)
- `subtitle` - Medium title (18px, semibold)
- `sectionTitle` - Section header (16px, bold)
- `bodyText` - Main content text (16px)
- `caption` - Caption text (14px)
- `smallText` - Small text (12px)

### **Buttons**
- `button` - Primary button
- `buttonSecondary` - Secondary button
- `buttonText` - Button text
- `buttonTextSecondary` - Secondary button text

### **Inputs**
- `input` - Text input field
- `inputLabel` - Input label

### **Lists**
- `listItem` - List item with borders
- `listItemText` - List item text

### **Headers & Footers**
- `header` - Page header
- `footer` - Page footer
- `footerText` - Footer text

### **Utilities**
- `row` - Horizontal flex row
- `center` - Centered content
- `spaceBetween` - Space between items

### **Status Styles**
- `success` - Success state
- `warning` - Warning state
- `error` - Error state

## 🔧 **Adding New Universal Styles**

### 1. **Add to `createThemeStyles` function**
```typescript
export const createThemeStyles = (currentColors: any) => StyleSheet.create({
  // ... existing styles ...
  
  newStyle: {
    backgroundColor: currentColors.cardBackground,
    color: currentColors.textPrimary,
    // ... other properties
  },
});
```

### 2. **Add corresponding colors to both palettes**
```typescript
// In Colors.ts
export const lightColors = {
  // ... existing colors ...
  newColor: '#value',
};

export const darkColors = {
  // ... existing colors ...
  newColor: '#value',
};
```

## 📱 **Example: Dashboard Page**

```typescript
import { useTheme } from '../context/ThemeContext';
import { lightColors, darkColors } from '../constants/Colors';
import { createThemeStyles } from '../styles/universalStyles';

const DashboardScreen = () => {
  const { resolvedTheme } = useTheme();
  const currentColors = resolvedTheme === 'dark' ? darkColors : lightColors;
  
  const universalStyles = createThemeStyles(currentColors);
  
  // Only define dashboard-specific styles
  const styles = StyleSheet.create({
    statsCard: {
      // Dashboard-specific styling
    },
  });
  
  return (
    <SafeAreaView style={universalStyles.container}>
      <ScrollView style={universalStyles.scrollView}>
        <View style={universalStyles.header}>
          <Text style={universalStyles.title}>Dashboard</Text>
        </View>
        
        <View style={[universalStyles.card, styles.statsCard]}>
          <Text style={universalStyles.bodyText}>Stats content</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
```

## ✨ **Benefits**

1. **Zero Duplication** - Common styles defined once
2. **Consistent Theming** - All pages use same color palette
3. **Easy Maintenance** - Change colors in one place
4. **Fast Development** - Copy pattern to any new page
5. **Type Safety** - Full TypeScript support
6. **Performance** - Styles only recreate when theme changes

## 🔄 **Theme Switching**

The system automatically handles theme switching:
- **Light mode**: Uses `lightColors` palette
- **Dark mode**: Uses `darkColors` palette
- **Automatic**: No manual updates needed
- **Persistent**: Theme preference saved to storage
