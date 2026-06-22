import Slider from '@react-native-community/slider'
import { useEffect, useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'

import { Theme } from '@lib/theme/ThemeManager'

type ThemedSliderProps = {
    label: string
    value: number
    onValueChange: (value: number) => void
    min?: number
    max?: number
    step?: number
    precision?: number
    showInput?: boolean
    disabled?: boolean
}

// `@react-native-community/slider` enumerates discrete steps internally; a range whose
// (max - min) / step is enormous makes it allocate a huge array and throw
// "RangeError: invalid array length". We cap how many discrete steps the native slider
// sees — the numeric text box stays exact, so precision is never lost.
const MAX_SLIDER_STEPS = 10000

const toSafeNumber = (val: number, fallback = 0) =>
    typeof val === 'number' && isFinite(val) ? val : fallback

const roundTo = (val: number, precision: number) =>
    parseFloat(toSafeNumber(val).toFixed(precision))

// The native slider can only render its thumb within [min, max], so we clamp the thumb
// position for display. The numeric text box is intentionally NOT clamped: users may type
// any value, including ones beyond the slider's visual range.
const clampToTrack = (val: number, min: number, max: number) =>
    Math.min(Math.max(toSafeNumber(val, min), min), max)

const ThemedSlider: React.FC<ThemedSliderProps> = ({
    label,
    value,
    onValueChange,
    min = 0,
    max = 1,
    step = 0,
    precision = 0,
    showInput = true,
    disabled = false,
}) => {
    const styles = useStyles()
    const { color } = Theme.useTheme()
    const [textValue, setTextValue] = useState(toSafeNumber(value).toString())
    const [isFocused, setIsFocused] = useState(false)

    // Keep the text box in sync with externally driven value changes (e.g. switching
    // presets), but never while the user is actively editing it — otherwise the input
    // would be rewritten mid-keystroke.
    useEffect(() => {
        if (!isFocused) setTextValue(roundTo(value, precision).toString())
    }, [value, precision, isFocused])

    const handleSliderChange = (v: number) => {
        const rounded = roundTo(v, precision)
        if (!isNaN(rounded)) onValueChange(rounded)
    }

    const handleTextInputChange = (t: string) => {
        // Allow free-form entry (including a lone '-' or trailing '.') while typing.
        setTextValue(t)
        const v = parseFloat(t)
        // No clamping to [min, max]: the text box accepts any valid value.
        if (!isNaN(v)) onValueChange(roundTo(v, precision))
    }

    const handleEndEdit = () => {
        setIsFocused(false)
        const v = parseFloat(textValue)
        if (isNaN(v)) {
            // Revert to the last known-good value on invalid input.
            setTextValue(roundTo(value, precision).toString())
            return
        }
        const rounded = roundTo(v, precision)
        onValueChange(rounded)
        setTextValue(rounded.toString())
    }

    // Thumb position is clamped to the visual track; the stored value may exceed it.
    const sliderValue = clampToTrack(value, min, max)

    // Bound the discrete step count so a wide range never overflows the native slider's
    // internal array. The text box still allows exact entry at full precision.
    const span = Math.abs(max - min)
    const effectiveStep =
        step > 0 && span / step > MAX_SLIDER_STEPS ? span / MAX_SLIDER_STEPS : step

    return (
        <View style={{ alignItems: `center` }}>
            {label && (
                <Text style={disabled ? styles.itemNameDisabled : styles.itemName}>{label}</Text>
            )}
            <View style={styles.sliderContainer}>
                <Slider
                    disabled={disabled}
                    style={styles.slider}
                    step={effectiveStep}
                    minimumValue={min}
                    maximumValue={max}
                    value={sliderValue}
                    onSlidingComplete={handleSliderChange}
                    minimumTrackTintColor={color.primary._400}
                    maximumTrackTintColor={color.neutral._600}
                    thumbTintColor={color.primary._500}
                />
                {showInput && (
                    <TextInput
                        editable={!disabled}
                        style={disabled ? styles.textBoxDisabled : styles.textBox}
                        value={textValue}
                        onChangeText={handleTextInputChange}
                        keyboardType="numbers-and-punctuation"
                        submitBehavior="blurAndSubmit"
                        onFocus={() => setIsFocused(true)}
                        onEndEditing={handleEndEdit}
                        onSubmitEditing={handleEndEdit}
                        onBlur={handleEndEdit}
                    />
                )}
            </View>
        </View>
    )
}

export default ThemedSlider

const useStyles = () => {
    const { color, spacing } = Theme.useTheme()
    return StyleSheet.create({
        itemName: {
            color: color.text._100,
        },

        itemNameDisabled: {
            color: color.text._700,
        },

        sliderContainer: {
            flexDirection: `row`,
        },

        slider: {
            flex: 9,
            height: 36,
        },

        textBox: {
            borderColor: color.neutral._400,
            color: color.text._100,
            borderWidth: 1,
            borderRadius: spacing.l,
            flex: 1.5,
            textAlign: `center`,
        },

        textBoxDisabled: {
            borderColor: color.neutral._700,
            color: color.neutral._700,
            borderWidth: 1,
            borderRadius: spacing.l,
            flex: 1.5,
            textAlign: `center`,
        },
    })
}
