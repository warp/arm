const HID = require('node-hid')
const five = require('johnny-five')
const mockFirmata = require('mock-firmata')

const TEST = process.env.NODE_ENV === 'test'

const DEVICE_PATH =
  'IOService:/AppleACPIPlatformExpert/PCI0@0/AppleACPIPCI/XHC1@14/XHC1@14000000/HS01@14100000/Gamesir-G3s 2.10@14100000/IOUSBHostInterface@0/IOUSBHostHIDDevice@14100000,0'

const SERVO_RANGE = {
  base: [0, 180],
  horizontal: [70, 180],
  vertical: [30, 120],
  gripper: [55, 160],
}

const GAMEPAD = {
  leftX: 1,
  leftY: 2,
  rightX: 3,
  rightY: 4,
  leftTrigger: 5,
  rightTrigger: 6,
}

const normalize = (value, [min, max]) => (max - min) * (value / 256) + min

const gamepad = new HID.HID(DEVICE_PATH)

const board = new five.Board({
  io: TEST ? new mockFirmata.Firmata() : undefined,
  repl: false,
})

board.on('ready', () => {
  const base = new five.Servo({
    pin: 'A0',
    range: SERVO_RANGE.base,
  })

  const horizontal = new five.Servo({
    pin: 'A1',
    range: SERVO_RANGE.horizontal,
  })

  const vertical = new five.Servo({
    pin: 'A2',
    range: SERVO_RANGE.vertical,
  })

  const gripper = new five.Servo({
    pin: 'A3',
    range: SERVO_RANGE.gripper,
  })

  gamepad.on('data', data => {
    base.to(normalize(data[GAMEPAD.leftX], SERVO_RANGE.base))
    horizontal.to(normalize(256 - data[GAMEPAD.leftY], SERVO_RANGE.horizontal))
    vertical.to(normalize(data[GAMEPAD.rightY], SERVO_RANGE.vertical))
    gripper.to(normalize(256 - data[GAMEPAD.rightTrigger], SERVO_RANGE.gripper))
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
