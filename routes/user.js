const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const nodemailer = require('nodemailer')
const crypto = require('crypto')
const Sequelize = require('sequelize')

const User = require('../models/user')
const Op = Sequelize.Op


const router = express.Router()

// MAIL TRAP
const transport = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "b6f631649c2e02",
    pass: "88d62957b800f2"
  }
})

const niceEmail = text => `
  <div style="
    border: 1px solid black;
    padding: 20px;
    font-family: sans-serif;
    line-height: 2;
    font-size: 20px
  ">
    <h2>Hello there!</h2>
    <p>${text}</p>

    <p>Wellcome to the jungle!</p>
  </div>
`


router.post('/register', async (req, res, next) => {
  try {
    const {name, email, password} = req.body

    const hashedPassword = await bcrypt.hash(password, 10)
  
    const user = await User.create({
      name,
      email,
      password: hashedPassword
    })

    await transport.sendMail({
      to: email,
      from: "jungleking@crap.org",
      subject: "Your registration went on smoothly!",
      html: niceEmail('Your registration was successful, bro/sis.')
    })
  
    res.json({user})
  } catch(e) {
    console.log(e.message)
  }
})

router.post('/login', async (req, res, next) => {
  try {
    const {email, password} = req.body


    const user = await User.findOne({where: {email}})


    const isMatch = await bcrypt.compare(password, user.password)

    res.json({pigoncrap: isMatch})

  } catch(e) {
    console.log(e.message)
  }
})


router.post('/reset-password', async (req, res, next) => {
  try {
    const {email} = req.body
    // create secured random values
    // want 32 random bytes - first arg
    // callback called after its done - second arg
    crypto.randomBytes(32, async (err, buffer) => {
      if (err) {
        console.log(err.message) 
        return res.json(err)
      }

      // make sensible string of charachters out of randon bytes
      const token = buffer.toString('hex')

      const user = await User.findOne({email})

      if (!user) {
        return res.json({errors: {email: 'No user with that email found'}})
      }

      user.resetToken = token
      user.resetTokenExpiration = Date.now() + 1000 * 60 * 60

      await user.save()

      await transport.sendMail({
        to: email,
        from: "jungleking@crap.org",
        subject: "Your registration went on smoothly!",
        html: `
          <p>You requested password reset yo</p>
          <p>Click this <a href="http://localhost:3000/api/user/password-reset/${token}">link</a> to set new password yo</p>
        `
      })

      res.json(user)
    })
  } catch(e) {
    console.log(e.message)
  }
})

router.post('/password-reset/:token', async (req, res, next) => {
  const { token } = req.params
  const { password } = req.body

  try {
    const user = await User.findOne({ where: { resetToken: token, resetTokenExpiration: {
      [Op.gt]: Date.now()
    }}})

    if (user) {
      const updatedPassword = await bcrypt.hash(password, 10)

      user.password = updatedPassword

      await user.save()

      return res.json(user)
    }

    res.json({errors: {email: 'User not found'}})
  } catch(e) {
    console.log(e.message)
  }
})


module.exports = router
