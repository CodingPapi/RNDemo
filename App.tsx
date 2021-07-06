import React, {useEffect} from 'react'
import {Platform, NativeEventEmitter, NativeModules, Button, Text, StyleSheet, View, DeviceEventEmitter, TouchableHighlight} from 'react-native'
import RNQccDfu from 'react-native-qcc-dfu'
import DocumentPicker from 'react-native-document-picker';
import Dialog from "react-native-dialog";

const App = () => {
  const [fireUri, setFileUri] = React.useState("")
  const [availableDevices, setAvailableDevices] = React.useState < Array < BluetoothDevice >> ([])
  const [connectedDevice, setConnectedDevice] = React.useState < BluetoothDevice | undefined > (undefined)
  const [process, setProcess] = React.useState(0)
  const [upgradeState, setUpgradeState] = React.useState < UpgradeState > ("END")
  const [dialogVisible, setDialogVisible] = React.useState(false)
  const [confirmation, setConfirmation] = React.useState < UpgradeConfirmation | undefined > (undefined)
  const [upgradeResult, setUpgradeResult] = React.useState < UpgradeResult | undefined > (undefined)
  const [appVersion, setAppVersion] = React.useState("")

  const emitter = Platform.OS === 'ios' ? new NativeEventEmitter(NativeModules.RNQccDfu) : DeviceEventEmitter

  useEffect(() => {
    console.log("add listener, better move to global init place to only register once")

    emitter.addListener('EventBluetoothDeviceUpdated', bluetoothDeviceUpdated)
    emitter.addListener('EventDeviceConnectionStateUpdate', deviceConnectedStateChange)
    emitter.addListener('EventDeviceUpgradeResult', upgradeResultMsg)
    emitter.addListener('EventDeviceUpgradeNeedsConfirm', upgradeNeedsConfirm)
    emitter.addListener('EventDeviceUpgradeProcess', upgradeProcess)
    emitter.addListener('EventDeviceUpgradeState', upgradeStateChanged)
    emitter.addListener('EventDeviceUpgradeAppVersion', upgradeAppVersionChanged)
    emitter.addListener('EventDeviceUpgradeButtonActions', onButtonActionsChanged)
    emitter.addListener('EventDeviceUpgradeButtonActionsResult', onButtonActionsUpdateResult)

    emitter.addListener('EventDeviceEQState', onEQStateUpdate)
    emitter.addListener('EventDeviceEQPresetsUpdate', onEQPresetsUpdate)
    emitter.addListener('EventDeviceEQSelectedPreset', onEQPresetSelected)

  },[])

  const connectDevice = (device: BluetoothDevice) => {
    RNQccDfu.connectDevice(device.name, device.address, deviceConnectCallback)
  }

  const bluetoothDeviceUpdated = (devices: Array<BluetoothDevice>) => {
    setAvailableDevices(devices)
  }

  const deviceConnectedStateChange = (device: BluetoothDevice) => {
    if (device.connected === 'true') {
      setConnectedDevice(device)
      RNQccDfu.getApplicationVersion()
    } else {
      setConnectedDevice(undefined)
    }
  }

  const deviceConnectCallback = (device: BluetoothDevice) => {
    console.log(device)
  }

  const pickFile = async () => {
    // Pick a single file
    try {
      const res = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });
      console.log(
        res.uri,
        res.type, // mime type
        res.name,
        res.size
      );
      setFileUri(res.uri)
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        // User cancelled the picker, exit any dialogs or menus and move on
      } else {
        throw err;
      }
    }
  }

  const upgradeResultMsg = (data: UpgradeResult) => {
    setUpgradeResult(data)
    console.log(data)
  }
  const upgradeNeedsConfirm = (data: UpgradeConfirmation) => {
    // need to pop up a dialog to let user confirm options like native android did
    setConfirmation(data)
    console.log(data)
    setDialogVisible(true)
  }
  const upgradeStateChanged = (data: UpgradeStateData) => {
    setUpgradeState(data.upgradeState)
  }
  const upgradeAppVersionChanged = (data: AppVersion) => {
    setAppVersion(data.appVersion)
  }
  const onButtonActionsChanged = (data: ButtonConfiguration) => {
    console.log(data)
  }

  const onButtonActionsUpdateResult = (data: ButtonActionUpdateResult) => {
    console.log(data)
  }

  const onEQStateUpdate = (data: EQStateResult) => {
    console.log(data)
  }
  const onEQPresetsUpdate = (data: EQAvailablePresets) => {
    console.log(data)
  }
  const onEQPresetSelected = (data: EQPreset) => {
    console.log(data)
  }

  const getCurrentButtonActions = () => {
    RNQccDfu.getCurrentButtonActions()
  }
  const getDefaultButtonActions = () => {
    RNQccDfu.getDefaultButtonActions()
  }
  const configButtonActions = (data: CurrentButtonConf) => {
    RNQccDfu.configButtonActions(data)
  }
  const upgradeProcess = (data: UpgradeProcess) => {
    setProcess(data.upgradeProgress)
  }

  const handleConfirmOption = (option: UpgradeOption) => {
    setDialogVisible(false)
    RNQccDfu.confirmUpgrade(confirmation?.confirmation, option)
  }

  return (
    <View style={styles.container}>
      <Text>You selected {fireUri} </Text>
      <Button onPress={() => pickFile()} title='pick file' />

      <Button onPress={() => getDefaultButtonActions()} title='get default actions' />
      <Button onPress={() => getCurrentButtonActions()} title='get current actions' />

      <Button onPress={() => configButtonActions({
        enabled: true,
        cancelSiri: {
          ear: "LR",
          action: "SINGLECLICK"
        },
        pausePlay: {
          ear: "LR",
          action: "DOUBLECLICK"
        },
        nextItem: {
          ear: "R",
          action: "DOUBLECLICK"
        },
        pickHang: {
          ear: "LR",
          action: "SINGLECLICK"
        },
        preItem: {
          ear: "L",
          action: "DOUBLECLICK"
        },
        screenCall: {
          ear: "LR",
          action: "LONGPRESSONE"
        },
        startSiri: {
          ear: "LR",
          action: "TRIPLECLICK"
        },
        volumeDown: {
          ear: "R",
          action: "LONGPRESSONE"
        },
        volumeUp: {
          ear: "L",
          action: "LONGPRESSONE"
        }
      })} title='config button actions' />

      <Text>connected device {connectedDevice?.name} </Text>
      <Button onPress={() => RNQccDfu.updateBluetoothDevices()} title='Update device list' />

      <Button onPress={() => RNQccDfu.startUpgrade(fireUri)} title='StartUpgrade' />
      <Text>upgrade process {process} </Text>

      <Button onPress={() => RNQccDfu.updateAllEQInfo()} title='update EQ info' />
      <Text>upgrade EQ info</Text>

      <Button onPress={() => RNQccDfu.selectEQPreset(1)} title='select EQ Preset' />
      <Text>select EQ preset</Text>

      <Button onPress={() => RNQccDfu.cancelUpgrade()} title='abort upgrade' />
      <Text>App version: {appVersion}</Text>
      <Button onPress={() => RNQccDfu.getApplicationVersion()} title='get appVersion' />
      <Text>Upgrade State: {upgradeState}</Text>
      <Text>Upgrade Result: {upgradeResult?.resultType}</Text>

      {availableDevices.map(device => (
        <TouchableHighlight onPress={() => connectDevice(device)} key={device.address}>
          <View style={styles.item}>
            <Text>{device.name} {device.address}</Text>
          </View>
        </TouchableHighlight>
      ))}
      <Dialog.Container visible={dialogVisible}>
        <Dialog.Title>Needs Confirmation</Dialog.Title>
        <Dialog.Description>Needs Confirmation: {confirmation?.confirmation}</Dialog.Description>
        {confirmation?.options.map(item => (
          <Dialog.Button label={item} onPress={()=>handleConfirmOption(item)} key={item}/>
        ))}
      </Dialog.Container>
    </View>
  )
}

interface BluetoothDevice {
  address: string
  name: string
  type?: string
  connected?: string
}

type ResultType = "SILENT_COMMIT"|"COMPLETE"|"UPGRADE_IN_PROGRESS_WITH_DIFFERENT_ID"|"ABORTED"

interface UpgradeResult {
  resultType: ResultType
}

type UpgradeState = "INITIALISATION"|"UPLOAD"|"VALIDATION"|"REBOOT"|"VERIFICATION"|"COMPLETE"|"END"|"RECONNECTING"|"ABORTING"|"ABORTED"

interface UpgradeStateData {
  upgradeState: UpgradeState
}

interface AppVersion {
  appVersion: string
}

type ButtonActions = "UNDIFINED"|"SINGLECLICK"|"DOUBLECLICK"|"TRIPLECLICK"|"LONGPRESSONE"|"LONGPRESSTHREE"
type ButtonActionPosition = "L"|"R"|"LR"
interface ButtonConf {
  ear: ButtonActionPosition
  action: ButtonActions
}
interface DefaultButtonConf {
  pausePlay?: ButtonConf
  preItem?: ButtonConf
  nextItem?: ButtonConf
  volumeUp?: ButtonConf
  volumeDown?: ButtonConf
  pickHang?: ButtonConf
  screenCall?: ButtonConf
  startSiri?: ButtonConf
  cancelSiri?: ButtonConf
}

interface CurrentButtonConf extends DefaultButtonConf {
  enabled: boolean
}

interface ButtonConfiguration {
  defaultActions: DefaultButtonConf
  currentActions: CurrentButtonConf
}

interface ButtonActionUpdateResult {
  updateSuccess: boolean
}

interface UpgradeProcess {
  upgradeProgress: number
}

type UpgradeOption = "CANCEL" | "ABORT" | "CONFIRM" | "INTERACTIVE_COMMIT" | "SILENT_COMMIT"

interface UpgradeConfirmation {
  confirmation: "BATTERY_LOW_ON_DEVICE" | "COMMIT" | "IN_PROGRESS" | "TRANSFER_COMPLETE" | "WARNING_FILE_IS_DIFFERENT"
  options: Array<UpgradeOption>
}

interface EQStateResult {
  ready: boolean
}

interface EQPreset {
  name: string
  value: number
}
type EQAvailablePresets = EQPreset[]

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    height: 900,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
})

export default App
