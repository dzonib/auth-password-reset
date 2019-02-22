const Sequelize = require('sequelize')


const sequelize = new Sequelize('passwordresetdb', 'dzonib', '123456', {
  host: "localhost",
  dialect: "postgres",
  protocol: "postgres"
})


module.exports = sequelize