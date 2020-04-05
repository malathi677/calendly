const image2base64 = require('image-to-base64');

image2base64("https://www.theyeshivaworld.com/wp-content/uploads/2016/09/AlteredCheckFigure1.jpg")
    .then(
        (response) => {
            console.log(response); //iVBORw0KGgoAAAANSwCAIA...
        }
    )
    .catch(
        (error) => {
            console.log(error); //Exepection error....
        }
    )