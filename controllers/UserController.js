const db = require('../models');
const parsingService = require('../services/parsing');
const { v4: uuidv4 } = require('uuid');

function validateEmail(email) {
  const re = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/g);
  return re.test(String(email).toLowerCase());
}

const subscription = async (req, res) => {
  const { email, price } = req.body;
  console.log(email);
  if (!validateEmail(email)) {
    res.status(400).send('invalid email');
    return;
  }

  if (isNaN(+price)) {
    res.status(400).send('invalid price');
    return;
  }

  const token = uuidv4();

  try {
    let user = await db.User.findOne({ where: { email }});
    if (user) {
      await user.update({ price });
    } else {
      user = await  db.User.create({email, price, token});
    }
    await parsingService.getLatestPrice();
    await parsingService.comparePriceForUser(user)
  } catch (e) {
    res.status(500).send('something went wrong =(');
  }
  res.status(200);
  res.end();
}

const unsubscription = async (req, res) => {
  const token = req.query.token;

  try {
    await db.User.destroy( { where: { token }})
  } catch (e) {
    res.status(500).send('something went wrong =(');
  }
  res.status(200);
  res.send('deleted from db');
  res.end();
}


module.exports = {
  subscription,
  unsubscription
}
