document.addEventListener('DOMContentLoaded', e => {
  document.querySelector('.legend-button').addEventListener('click', handleLegendClick);
  document.querySelector('.legend-button').addEventListener('touch', handleLegendClick);
  document.body.addEventListener('keydown', closeDrawer);
});

function handleLegendClick(e) {
  e.currentTarget.parentElement.classList.toggle('legend--open');
}

function closeDrawer(e) {
  var openDrawer = document.querySelector('.legend--open');

  if (
    e.keyCode === 27 &&
    openDrawer !== null
  ) {
    openDrawer.classList.remove('legend--open');
  }
}
