const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json())

let users = []
let exercises = []
let nextUserId = 1

function generateId() {
  return (nextUserId++).toString().padStart(24, '0')
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
  const { username } = req.body
  
  if (!username) {
    return res.json({ error: 'Username is required' })
  }
  
  const _id = generateId()
  const user = { username, _id }
  users.push(user)
  
  res.json({ username, _id })
})

app.get('/api/users', (req, res) => {
  res.json(users)
})

app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params
  const { description, duration, date } = req.body
  
  const user = users.find(u => u._id === _id)
  if (!user) {
    return res.json({ error: 'User not found' })
  }
  
  if (!description || !duration) {
    return res.json({ error: 'Description and duration are required' })
  }
  
  const exerciseDate = date ? new Date(date) : new Date()
  if (date && isNaN(exerciseDate.getTime())) {
    return res.json({ error: 'Invalid date format' })
  }
  
  const exercise = {
    username: user.username,
    description,
    duration: parseInt(duration),
    date: exerciseDate.toDateString(),
    _id: user._id
  }
  
  exercises.push({ ...exercise, userId: _id })
  
  res.json(exercise)
})

app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params
  const { from, to, limit } = req.query
  
  const user = users.find(u => u._id === _id)
  if (!user) {
    return res.json({ error: 'User not found' })
  }
  
  let userExercises = exercises.filter(ex => ex.userId === _id)
  
  if (from) {
    const fromDate = new Date(from)
    if (!isNaN(fromDate.getTime())) {
      userExercises = userExercises.filter(ex => new Date(ex.date) >= fromDate)
    }
  }
  
  if (to) {
    const toDate = new Date(to)
    if (!isNaN(toDate.getTime())) {
      userExercises = userExercises.filter(ex => new Date(ex.date) <= toDate)
    }
  }
  
  if (limit) {
    const limitNum = parseInt(limit)
    if (limitNum > 0) {
      userExercises = userExercises.slice(0, limitNum)
    }
  }
  
  const log = userExercises.map(ex => ({
    description: ex.description,
    duration: ex.duration,
    date: ex.date
  }))
  
  res.json({
    username: user.username,
    count: log.length,
    _id: user._id,
    log
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})