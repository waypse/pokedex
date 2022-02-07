let badges = [...document.querySelectorAll('.badg')];
badges.forEach((badge, idx) => {
    badge.style.backgroundImage = `url('/img/badges/${idx+1}.png')`;
});