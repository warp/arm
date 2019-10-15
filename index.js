const HID = require('node-hid')
const five = require('johnny-five')
const mockFirmata = require('mock-firmata')

const TEST = process.env.NODE_ENV === 'test'

const args = process.argv.slice(2)
const [productName = 'Gamesir-G3s 2.10'] = args

const devices = HID.devices()
const device = devices.find(device => device.product === productName)

if (!device) {
  const productNames = devices.map(device => device.product).join(', ')
  throw `Unable to find ${productName} in ${productNames}`
}

const SERVO_RANGE = {
  base: [0, 180],
  horizontal: [70, 180],
  vertical: [30, 120],
  gripper: [55, 125],
}

const SERVO_POSITION = {
  base: 90,
  horizontal: 125,
  vertical: 75,
  gripper: 90,
}

const GAMEPAD = {
  leftX: 1,
  leftY: 2,
  rightX: 3,
  rightY: 4,
  leftTrigger: 5,
  rightTrigger: 6,
}

const clamp = (axis, value) => {
  const [min, max] = SERVO_RANGE[axis]
  return Math.min(Math.max(value, min), max)
}

const relativePosition = (axis, value) => {
  SERVO_POSITION[axis] = clamp(axis, SERVO_POSITION[axis] + (value - 128) / 128)
  return SERVO_POSITION[axis]
}

const absolutePosition = (axis, value) => {
  const [min, max] = SERVO_RANGE[axis]
  return (max - min) * (value / 256) + min
}

const gamepad = new HID.HID(device.path)

const board = new five.Board({
  io: TEST ? new mockFirmata.Firmata() : undefined,
  repl: false,
})

board.on('ready', () => {
  const base = new five.Servo({
    pin: 'A0',
    range: SERVO_RANGE.base,
    center: true,
  })

  const horizontal = new five.Servo({
    pin: 'A1',
    range: SERVO_RANGE.horizontal,
    center: true,
  })

  const vertical = new five.Servo({
    pin: 'A2',
    range: SERVO_RANGE.vertical,
    center: true,
  })

  const gripper = new five.Servo({
    pin: 'A3',
    range: SERVO_RANGE.gripper,
    center: true,
  })

  let input

  gamepad.on('data', data => {
    input = data
  })

  setInterval(() => {
    if (!input) return

    base.to(relativePosition('base', input[GAMEPAD.leftX]))
    horizontal.to(relativePosition('horizontal', 256 - input[GAMEPAD.leftY]))
    vertical.to(relativePosition('vertical', input[GAMEPAD.rightY]))
    gripper.to(absolutePosition('gripper', 256 - input[GAMEPAD.rightTrigger]))
  }, 10)

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
