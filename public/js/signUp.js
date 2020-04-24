// Elements

const $submit = document.querySelector('.submit');

// Event Litseners

$submit.addEventListener('click', event => {
  console.log('cliced');

  event.preventDefault();
});
