const ioHook = require('iohook')
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

const clamp = (value, min, max) => Math.max(Math.min(value, max), min)

const board = new five.Board({
  io: TEST ? new mockFirmata.Firmata() : undefined,
  repl: false,
})

board.on('ready', () => {
  const base = new five.Servo({
    pin: 'A0',
    range: [BASE_MIN, BASE_MAX],
  })
  base.home()

  const horizontal = new five.Servo({
    pin: 'A1',
    range: [HORIZONTAL_MIN, HORIZONTAL_MAX],
  })
  horizontal.home()

  const vertical = new five.Servo({
    pin: 'A2',
    range: [VERTICAL_MIN, VERTICAL_MAX],
  })
  vertical.home()

  const gripper = new five.Servo({
    pin: 'A3',
    range: [GRIPPER_MIN, GRIPPER_MAX],
  })
  gripper.home()

  ioHook.on('mousemove', ({ x, y }) => {
    console.log('mousemove', { x, y })
    base.to(x / 5)
    horizontal.to(HORIZONTAL_MAX - y / 4)
  })

  let verticalPosition = (VERTICAL_MIN + VERTICAL_MAX) / 2
  ioHook.on('mousewheel', ({ rotation }) => {
    console.log('mousewheel', { rotation })
    verticalPosition = clamp(
      verticalPosition + rotation * 2,
      VERTICAL_MIN,
      VERTICAL_MAX
    )
    vertical.to(verticalPosition)
  })

  let gripperPosition = GRIPPER_MIN
  ioHook.on('mousedown', ({ button }) => {
    console.log('mousedown', { button })
    gripperPosition = clamp(
      button === 1 ? gripperPosition - 5 : gripperPosition + 5,
      GRIPPER_MIN,
      GRIPPER_MAX
    )
    gripper.to(gripperPosition)
  })

  board.on('exit', () => {
    console.log('board.exit')
    ioHook.unload()
  })
  ioHook.disableClickPropagation()
  ioHook.start()
})

if (TEST) board.emit('ready', null)
