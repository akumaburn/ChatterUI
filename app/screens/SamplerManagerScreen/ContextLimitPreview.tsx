import { FontAwesome } from '@expo/vector-icons'
import React from 'react'
import { Text, View } from 'react-native'
import * as Progress from 'react-native-progress'

import { useContextLimit } from '@lib/hooks/ContextLimit'
import { Theme } from '@lib/theme/ThemeManager'

interface ContextLimitPreviewProps {
    generatedLength: number
}

const ContextLimitPreview: React.FC<ContextLimitPreviewProps> = ({ generatedLength }) => {
    const { color } = Theme.useTheme()
    const contextLimit = useContextLimit()
    // genamt <= 0 means unlimited generation; mirror the prompt-budget reserve used in
    // LocalInference so the preview reflects how much context the prompt can actually use.
    const unlimited = generatedLength <= 0
    const reserve = unlimited ? Math.min(2048, Math.floor(contextLimit / 4)) : generatedLength
    const leftover = Math.max(0, contextLimit - reserve)
    const limit = contextLimit > 0 ? leftover / contextLimit : 0
    const warning = leftover < Math.min(2048, 0.25 * contextLimit)
    const genLengthColor = warning ? color.error._300 : color.primary._200

    return (
        <View
            style={{
                borderRadius: 8,
                padding: 12,
                marginHorizontal: 4,
                rowGap: 8,
                borderWidth: 2,
                borderColor: color.primary._200,
            }}>
            <Text style={{ color: color.text._100 }}>
                Context Allocation <Text style={{ color: color.text._400 }}>({contextLimit})</Text>
            </Text>
            <Progress.Bar
                progress={limit}
                color={color.primary._400}
                borderColor={color.neutral._300}
                height={12}
                unfilledColor={genLengthColor}
                borderRadius={12}
                width={null}
            />
            <View style={{ flexDirection: 'row', columnGap: 24 }}>
                <Text style={{ color: color.text._400 }}>
                    <FontAwesome
                        name={warning ? 'exclamation-circle' : 'circle'}
                        style={{
                            color: warning ? color.error._300 : color.primary._400,
                        }}
                    />{' '}
                    Chat Context: {leftover}
                </Text>
                <Text style={{ color: color.text._400 }}>
                    <FontAwesome
                        name="circle"
                        style={{
                            color: genLengthColor,
                        }}
                    />{' '}
                    Generated: {unlimited ? 'Unlimited' : generatedLength}
                </Text>
            </View>
            {warning && (
                <Text style={{ color: color.error._300 }}>
                    Low Chat Context will forget messages faster
                </Text>
            )}
        </View>
    )
}

export default ContextLimitPreview
