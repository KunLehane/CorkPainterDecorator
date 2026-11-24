document.querySelectorAll('.blarney-frame input').forEach(slider => {
  slider.addEventListener('input', () => {
    slider.parentElement.style.setProperty('--position', slider.value + '%');
  });
});
