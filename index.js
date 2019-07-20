const HID = require('node-hid')
const five = require('johnny-five')
const mockFirmata = require('mock-firmata')

const TEST = process.env.NODE_ENV === 'test'

const BASE_MIN = 0
const BASE_MAX = 180

const HORIZONTAL_MIN = 70
const HORIZONTAL_MAX = 180

const VERTICAL_MIN = 30
const VERTICAL_MAX = 120

const GRIPPER_MIN = 55
const GRIPPER_MAX = 160

const VENDOR_ID = 1452
const PRODUCT_ID = 829
const DEVICE_PATH =
  'IOService:/AppleACPIPlatformExpert/PCI0@0/AppleACPIPCI/XHC1@14/XHC1@14000000/HS01@14100000/Gamesir-G3s 2.10@14100000/IOUSBHostInterface@0/IOUSBHostHIDDevice@14100000,0'

const GAMEPAD = {
  leftX: 1,
  leftY: 2,
  rightX: 3,
  rightY: 4,
  leftTrigger: 5,
  rightTrigger: 6,
}

const normalize = (value, min, max) => (max - min) * (value / 256) + min

const gamepad = new HID.HID(DEVICE_PATH)

const board = new five.Board({
  io: TEST ? new mockFirmata.Firmata() : undefined,
  repl: false,
})

board.on('ready', () => {
  const base = new five.Servo({
    pin: 'A0',
    range: [BASE_MIN, BASE_MAX],
  })

  const horizontal = new five.Servo({
    pin: 'A1',
    range: [HORIZONTAL_MIN, HORIZONTAL_MAX],
  })

  const vertical = new five.Servo({
    pin: 'A2',
    range: [VERTICAL_MIN, VERTICAL_MAX],
  })

  const gripper = new five.Servo({
    pin: 'A3',
    range: [GRIPPER_MIN, GRIPPER_MAX],
  })

  gamepad.on('data', data => {
    base.to(normalize(data[GAMEPAD.leftX], BASE_MIN, BASE_MAX))
    horizontal.to(
      normalize(256 - data[GAMEPAD.leftY], HORIZONTAL_MIN, HORIZONTAL_MAX)
    )
    vertical.to(normalize(data[GAMEPAD.rightY], VERTICAL_MIN, VERTICAL_MAX))
    gripper.to(
      normalize(256 - data[GAMEPAD.rightTrigger], GRIPPER_MIN, GRIPPER_MAX)
    )
  })

  process.on('SIGINT', () => {
    gamepad.close()
    base.stop()
    horizontal.stop()
    vertical.stop()
    gripper.stop()
    board.io.transport.close()
  })
})

if (TEST) board.emit('ready', null)
