import { useFocusEffect } from 'expo-router'
import React, { useEffect, useState } from 'react'
import { BackHandler, Platform, View } from 'react-native'
import { useMMKVBoolean, useMMKVNumber } from 'react-native-mmkv'
import Animated, { Easing, SlideInRight, SlideOutRight } from 'react-native-reanimated'
import { useShallow } from 'zustand/react/shallow'

import ThemedButton from '@components/buttons/ThemedButton'
import HorizontalSelector from '@components/input/HorizontalSelector'
import ThemedSlider from '@components/input/ThemedSlider'
import ThemedSwitch from '@components/input/ThemedSwitch'
import SectionTitle from '@components/text/SectionTitle'
import Alert from '@components/views/Alert'
import { AppSettings, Global } from '@lib/constants/GlobalValues'
import { cacheTypeValues, flashAttnValues, Llama } from '@lib/engine/Local/LlamaLocal'
import { KV } from '@lib/engine/Local/Model'
import useBackendDevices from '@lib/hooks/BackendDevices'
import { Logger } from '@lib/state/Logger'
import { readableFileSize } from '@lib/utils/File'

type ModelSettingsProp = {
    modelImporting: boolean
    modelLoading: boolean
    exit: () => void
}

const deviceLabels = { GPUOpenCL: 'OpenCL', HTP0: 'Hexagon', CPU: 'CPU' }

const ModelSettings: React.FC<ModelSettingsProp> = ({ modelImporting, modelLoading, exit }) => {
    const { config, setConfig } = Llama.useLlamaPreferencesStore(
        useShallow((state) => ({
            config: state.config,
            setConfig: state.setConfiguration,
        }))
    )

    const devices = useBackendDevices()

    const [saveKV, setSaveKV] = useMMKVBoolean(AppSettings.SaveLocalKV)
    const [autoloadLocal, setAutoloadLocal] = useMMKVBoolean(AppSettings.AutoLoadLocal)
    const [showModelInChat, setShowModelInChat] = useMMKVBoolean(AppSettings.ShowModelInChat)
    const [threadCount] = useMMKVNumber(Global.CPUThreads)

    const [kvSize, setKVSize] = useState(0)

    const getKVSize = async () => {
        const size = await KV.getKVSize()
        setKVSize(size)
    }

    useEffect(() => {
        getKVSize()
    }, [])

    const backAction = () => {
        exit()
        return true
    }

    useFocusEffect(() => {
        const handler = BackHandler.addEventListener('hardwareBackPress', backAction)
        return () => handler.remove()
    })

    const handleDeleteKV = () => {
        Alert.alert({
            title: 'Delete KV Cache',
            description: `Are you sure you want to delete the KV Cache? This cannot be undone. \n\n This will clear up ${readableFileSize(kvSize)} of space.`,
            buttons: [
                { label: 'Cancel' },
                {
                    label: 'Delete KV Cache',
                    onPress: async () => {
                        await KV.deleteKV()
                        Logger.info('KV Cache deleted!')
                        getKVSize()
                    },
                    type: 'warning',
                },
            ],
        })
    }

    return (
        <Animated.ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            entering={SlideInRight.easing(Easing.inOut(Easing.cubic))}
            exiting={SlideOutRight.easing(Easing.inOut(Easing.cubic))}>
            <SectionTitle>CPU Settings</SectionTitle>
            <View style={{ marginTop: 16 }} />
            {config && (
                <>
                    <ThemedSlider
                        label="Max Context"
                        value={config.context_length}
                        onValueChange={(value) => setConfig({ ...config, context_length: value })}
                        min={256}
                        max={1048576}
                        step={1024}
                        disabled={modelImporting || modelLoading}
                    />
                    <ThemedSlider
                        label="Threads"
                        value={config.threads}
                        onValueChange={(value) => setConfig({ ...config, threads: value })}
                        min={1}
                        max={threadCount ?? 8}
                        step={1}
                        disabled={modelImporting || modelLoading}
                    />

                    <ThemedSlider
                        label="Batch"
                        value={config.batch}
                        onValueChange={(value) => setConfig({ ...config, batch: value })}
                        min={16}
                        max={4096}
                        step={16}
                        disabled={modelImporting || modelLoading}
                    />

                    <ThemedSlider
                        label="Micro Batch (uBatch)"
                        value={config.ubatch}
                        onValueChange={(value) => setConfig({ ...config, ubatch: value })}
                        min={16}
                        max={4096}
                        step={16}
                        disabled={modelImporting || modelLoading}
                    />

                    {/* Note: llama.rn does not have any Android gpu acceleration */}
                    {(Platform.OS === 'ios' || devices.length > 1) && (
                        <ThemedSlider
                            label="GPU Layers"
                            value={config.gpu_layers}
                            onValueChange={(value) => setConfig({ ...config, gpu_layers: value })}
                            min={0}
                            max={256}
                            step={1}
                            disabled={modelImporting || modelLoading}
                        />
                    )}

                    <ThemedSlider
                        label="CPU MoE Layers"
                        value={config.cpu_moe_layers}
                        onValueChange={(value) => setConfig({ ...config, cpu_moe_layers: value })}
                        min={0}
                        max={256}
                        step={1}
                        disabled={modelImporting || modelLoading}
                    />

                    <HorizontalSelector
                        style={{ paddingBottom: 12 }}
                        label="Flash Attention"
                        values={flashAttnValues.map((item) => ({
                            label: item.toUpperCase(),
                            value: item,
                        }))}
                        selected={config.flash_attn}
                        onPress={(value) => setConfig({ ...config, flash_attn: value })}
                    />

                    <HorizontalSelector
                        style={{ paddingBottom: 12 }}
                        label="KV Cache Type (K)"
                        values={cacheTypeValues.map((item) => ({
                            label: item.toUpperCase(),
                            value: item,
                        }))}
                        selected={config.cache_type_k}
                        onPress={(value) => setConfig({ ...config, cache_type_k: value })}
                    />

                    <HorizontalSelector
                        style={{ paddingBottom: 12 }}
                        label="KV Cache Type (V)"
                        values={cacheTypeValues.map((item) => ({
                            label: item.toUpperCase(),
                            value: item,
                        }))}
                        selected={config.cache_type_v}
                        onPress={(value) => setConfig({ ...config, cache_type_v: value })}
                    />

                    <ThemedSwitch
                        label="Context Shift"
                        value={config.ctx_shift}
                        onChangeValue={(value) => {
                            setConfig({ ...config, ctx_shift: value })
                        }}
                    />

                    <ThemedSwitch
                        label="Use mmap"
                        value={config.use_mmap}
                        onChangeValue={(value) => setConfig({ ...config, use_mmap: value })}
                        description="Memory-map the model file instead of loading it fully into RAM."
                    />

                    <ThemedSwitch
                        label="Use mlock"
                        value={config.use_mlock}
                        onChangeValue={(value) => setConfig({ ...config, use_mlock: value })}
                        description="Lock the model in RAM to prevent it from being swapped out."
                    />

                    <ThemedSwitch
                        label="Unified KV Cache"
                        value={config.kv_unified}
                        onChangeValue={(value) => setConfig({ ...config, kv_unified: value })}
                    />

                    <ThemedSwitch
                        label="Full SWA Cache"
                        value={config.swa_full}
                        onChangeValue={(value) => setConfig({ ...config, swa_full: value })}
                    />

                    <ThemedSwitch
                        label="Disable Extra Buffers"
                        value={config.no_extra_bufts}
                        onChangeValue={(value) => setConfig({ ...config, no_extra_bufts: value })}
                        description="Disables extra buffer types for weight repacking. Lowers memory use at the cost of slower prompt processing."
                    />

                    {devices.length > 1 && (
                        <HorizontalSelector
                            style={{ paddingBottom: 12 }}
                            label="Backend Device"
                            values={devices.map((item) => ({
                                label: deviceLabels[item as keyof typeof deviceLabels] ?? item,
                                value: item,
                            }))}
                            selected={config.devices?.[0]}
                            onPress={(value) => {
                                const devices = value === 'CPU' ? [value] : [value, 'CPU']
                                setConfig({ ...config, devices })
                            }}
                        />
                    )}
                </>
            )}
            <SectionTitle>Advanced Settings</SectionTitle>
            <ThemedSwitch
                label="Show Model Name In Chat"
                value={showModelInChat}
                onChangeValue={setShowModelInChat}
            />
            <ThemedSwitch
                label="Automatically Load Model on Chat"
                value={autoloadLocal}
                onChangeValue={setAutoloadLocal}
            />
            <ThemedSwitch
                label="Save Local KV"
                value={saveKV}
                onChangeValue={setSaveKV}
                description={
                    saveKV
                        ? ''
                        : 'Saves the KV cache on generations, allowing you to continue sessions after closing the app. Must use the same model for this to function properly. Saving the KV cache file may be very big and negatively impact battery life!'
                }
            />
            {saveKV && (
                <ThemedButton
                    buttonStyle={{ marginTop: 8 }}
                    label={'Purge KV Cache (' + readableFileSize(kvSize) + ')'}
                    onPress={handleDeleteKV}
                    variant={kvSize === 0 ? 'disabled' : 'critical'}
                />
            )}
        </Animated.ScrollView>
    )
}

export default ModelSettings
