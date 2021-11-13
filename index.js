import express from 'express';
import methodOverride from 'method-override';
import { read, add, write } from './jsonFileStorage.js';

const app = express();
app.set('view engine', 'ejs');

// Configure Express to parse request body data into request.body
app.use(express.urlencoded({ extended: false }));

app.use(express.static('public'));

app.use(methodOverride('_method'));

const sightingForm = (request, response) => {
  const today = new Date();
  const date = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;
  const time = new Date(new Date().getTime()).toLocaleTimeString();
  // const time = `${today.getHours()}:${today.getMinutes()}:${today.getSeconds()}`;
  const dateTime = `${date} ${time}`;
  response.render('sighting', { dateTime });
};

// Accept a POST request to create a new sighting
const addSighting = (request, response) => {
  // Add new sighting data in request.body to sightings array in data.json.
  add('data.json', 'sightings', request.body, (err) => {
    if (err) {
      response.status(500).send('DB write error.');
      return;
    }
    response.redirect('/');
  });
};

const getSightingByIndex = (request, response) => {
  read('data.json', (err, data) => {
    if (err) {
      response.status(500).send('DB read error.');
    }
    const { index } = request.params;

    // checking if index is valid
    if (data.sightings[index]) {
      const requiredSighting = data.sightings[index];
      response.render('single-sighting', { requiredSighting, index });
    }
    else {
      response.status(404).send('Sorry, there is no such sighting!');
    }
  });
};

const getAllSightings = (request, response) => {
  read('data.json', (err, data) => {
    if (err) {
      response.status(500).send('DB read error.');
    }
    else {
      const sightingSort = request.query.sighting;

      if (sightingSort === 'shape') {
        data.sightings.sort((a, b) => a.shape.localeCompare(b.shape));
        // data.sightings.sort((a, b) => {
        //   if (a.shape < b.shape) { return -1; }
        //   if (a.shape > b.shape) { return 1; }
        //   return 0;
        // });
        console.log('sorted by shape');
      }
      if (sightingSort === 'city') {
        data.sightings.sort((a, b) => a.city.localeCompare(b.city));
        console.log('sorted by city');
      }
      if (sightingSort === 'state') {
        data.sightings.sort((a, b) => a.state.localeCompare(b.state));
      }
      // if (sightingSort === 'date_time') {
      //   data.sightings.sort((a, b) => new Date(a.date_time) - new Date(b.date_time));
      // }
      response.render('all-sightings', data);
    }
  });
};

const editSighting = (request, response) => {
  read('data.json', (err, data) => {
    if (err) {
      response.status(500).send('DB read error.');
    }
    else {
      const { index } = request.params;
      const requiredSighting = data.sightings[index];
      requiredSighting.index = index;
      response.render('edit', requiredSighting);
    }
  });
};

const putEditedSighting = (request, response) => {
  read('data.json', (err, data) => {
    if (err) {
      response.status(500).send('DB read error.');
    }
    else {
      const { index } = request.params;
      data.sightings[index] = request.body;
      write('data.json', data, (err) => {
        response.redirect(`/sighting/${index}`);
      });
    }
  });
};

const deleteSighting = (request, response) => {
  // Remove element from DB at given index
  const { index } = request.params;
  read('data.json', (err, data) => {
    data.sightings.splice(index, 1);
    write('data.json', data, (err) => {
      console.log('Sighting deleted');
      response.redirect('/');
    });
  });
};

const getSightingShapes = (request, response) => {
  read('data.json', (err, data) => {
    const shapeArray = [];
    for (let i = 0; i < data.sightings.length; i += 1) {
      let isShapeRepeated = false;
      for (let j = 0; j < shapeArray.length; j += 1) {
        if (data.sightings[i].shape === shapeArray[j]) {
          isShapeRepeated = true;
        }
      }
      if (isShapeRepeated === false) {
        shapeArray.push(data.sightings[i].shape);
      }
    }
    response.render('shapes', { shapeArray });
  });
};

const showSightingOfShape = (request, response) => {
  const requiredShape = request.params.shape;
  read('data.json', (err, data) => {
    const content = { data, requiredShape };
    response.render('shapes-sightings', content);
  });
};

// Render a form that will create a new sighting
app.get('/sighting', sightingForm);

// Accept a POST request to create a new sighting
app.post('/sighting', addSighting);

// Render a single sighting
app.get('/sighting/:index', getSightingByIndex);

// Render a list of sightings
app.get('/', getAllSightings);

// Render a form to edit a sighting
app.get('/sighting/:index/edit', editSighting);

// Accept a request to edit a single sighting
app.put('/sighting/:index', putEditedSighting);

// Accept a request to delete a sighting
app.delete('/sighting/:index/delete', deleteSighting);

// Render a list of sighting shapes
app.get('/shapes', getSightingShapes);

// Render a list of sightings that has one shape
app.get('/shapes/:shape', showSightingOfShape);

app.listen(3004);
