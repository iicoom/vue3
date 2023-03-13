export const dragElement = (target, btn, color, tooltip, v) => {
  target.addEventListener('mousedown', (e) => {
    onMouseMove(e);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  });

  function onMouseMove (e) {
    e.preventDefault();
    let targetRect = target.getBoundingClientRect();

    let y = targetRect.bottom - e.pageY;
      if (y> targetRect.height) { y = targetRect.height };
      if (y < 0) { y = 0};
      btn.style.bottom = y - 10 + 'px';

      let percentPosition = y / targetRect.height * 100;
      color.style.height = percentPosition + "%";

      tooltip.style.bottom = y - 5 + 'px';
      tooltip.style.opacity = 1;

      tooltip.textContent = Math.round(percentPosition);
      v.volume = parseFloat((percentPosition/100).toFixed(2))
  }

  function onMouseUp(e) {
    window.removeEventListener('mousemove', onMouseMove);
    tooltip.style.opacity = 0;

    btn.addEventListener('mouseover', function () {
      tooltip.style.opacity = 1;
    });

    btn.addEventListener('mouseout', function () {
      tooltip.style.opacity = 0;
    });
  };
}
