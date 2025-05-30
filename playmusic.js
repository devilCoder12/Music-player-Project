document.addEventListener('DOMContentLoaded', () => {
    let currentSong = new Audio();
    let songs;
    let currentFolder;

    function formatMusicTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        const formatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        return formatted;
    }


    // fetching song
    async function getSongs(folder) {
        currentFolder = folder;
        let url = await fetch(`http://127.0.0.1:5500/${currentFolder}/`);
        console.log(url)
        let response = await url.text()
        let div = document.createElement('div');
        div.innerHTML = response
        let aTags = div.getElementsByTagName('a')
        songs = []
        for (let index = 0; index < aTags.length; index++) {
            let element = aTags[index];
            if (element.href.endsWith(".mp3")) {
                songs.push(element.href.split(`/${currentFolder}/`)[1])
            }
        }

        //fetching artist name from json
        let artistName;
        let link = await fetch(`http://127.0.0.1:5500/${currentFolder}/info.json`);
        let res = await link.json();
        artistName = res.artist || "Unknown";

        let songListUl = document.querySelector('.songs-list').getElementsByTagName('ul')[0];
        songListUl.innerHTML = ''
        for (const song of songs) {
            const displayName = song.replace(/\.mp3$/i, '').replaceAll("%20", " ");
            songListUl.innerHTML += `
        <li data-song="${song}">
            <img class="invert" src="imgs/music.svg" alt="">
            <div class="info">
                <div>${displayName.slice(0, 15)}...</div>
                <div class="artist-div">${artistName}</div>
            </div>
            <div class="play-now">
                <span>Play now</span>
                <img class="invert" src="imgs/playbtn.svg" alt="">
            </div>
        </li>`;
        }

        Array.from(document.querySelector('.songs-list').getElementsByTagName('li')).forEach((e) => {
            e.addEventListener('click', () => {
                const actualSong = e.getAttribute('data-song');
                playMusic(actualSong);
            });
        });
    }


    const playMusic = (track, pause = false) => {
        currentSong.src = `/${currentFolder}/` + track;
        if (!pause) {
            currentSong.play();
            play.src = 'imgs/pause.svg';
        }
        // document.querySelector('.song-name').innerHTML = `<span>${decodeURI(track.replace(/\.mp3$/i, ''))}</span>`
        const songNameEl = document.querySelector('.song-name');
        if (songNameEl) {
            songNameEl.innerHTML = `<span>${decodeURI(track.replace(/\.mp3$/i, ''))}</span>`;
        }
        document.querySelector('.song-time').innerHTML = `<span>00:00/00:00</span>`
    }

    //Display all the albums on the page
    async function displayAlbums() {
        let url = await fetch(`http://127.0.0.1:5500/songs/`);
        let response = await url.text();
        const div = document.createElement('div');
        div.innerHTML = response
        let anchors = div.getElementsByTagName('a');
        let cardContainer = document.querySelector('.cardContainer')

        let array = Array.from(anchors)
        for (let index = 0; index < array.length; index++) {
            let anchor = array[index];
            if (anchor.href.includes(`/songs/`)) {
                let folder = anchor.href.split('/').splice(-2)[1];
                let url = await fetch(`http://127.0.0.1:5500/songs/${folder}/info.json`);
                let res = await url.json();
                cardContainer.innerHTML = cardContainer.innerHTML + `
                <div data-folder="${folder}" class="card">
                        <div class="playButtons">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0.5 25 24" width="30" height="30"
                                id="play-circle">
                                <path fill="#00000"
                                    d="M16,10.27,11,7.38A2,2,0,0,0,8,9.11v5.78a2,2,0,0,0,1,1.73,2,2,0,0,0,2,0l5-2.89a2,2,0,0,0,0-3.46ZM15,12l-5,2.89V9.11L15,12ZM12,2A10,10,0,1,0,22,12,10,10,0,0,0,12,2Zm0,18a8,8,0,1,1,8-8A8,8,0,0,1,12,20Z" />
                            </svg>
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="Callnu">
                        <h2>${res.title.slice(0, 15)}...</h2>
                        <p>
                        ${res.description > 13 ? res.description: res.description.slice(0, 14)}...
                        </p>
                    </div>`
            }
            playSongs();
        }
    }

    async function renderSongs() {
        await getSongs('songs/rahat');
        playMusic(songs[0], true);

        displayAlbums();

        // music control functions
        document.querySelector('#play').addEventListener('click', () => {
            if (currentSong.paused) {
                currentSong.play()
                play.src = 'imgs/pause.svg'
            } else {
                currentSong.pause()
                play.src = 'imgs/playbtn.svg'
            }
        })

        // time update in play bar
        currentSong.addEventListener('timeupdate', () => {
            if (!isNaN(currentSong.duration)) {
                document.querySelector('.play-bar-info').innerHTML = `
                ${formatMusicTime(currentSong.currentTime)}/-${formatMusicTime(currentSong.duration - currentSong.currentTime)}`;
                document.querySelector('.circle').style.left = (currentSong.currentTime / currentSong.duration) * 100 + '%';
            }
        });

        // // play bar  previous btn function
        document.querySelector('#previous-btn').addEventListener('click', () => {
            const currentFilename = currentSong.src.split('/').pop();
            const songsIndex = songs.indexOf(currentFilename);

            if (songsIndex > 0) {
                playMusic(songs[songsIndex - 1]);
            }
        });


        // // play bar  next btn function
        document.querySelector('#next-btn').addEventListener('click', () => {
            let currentFilename = currentSong.src.split('/').pop();
            let songsIndex = songs.indexOf(currentFilename);

            if (songsIndex === -1 || songsIndex + 1 >= songs.length) {
                return;
            }

            let nextSong = songs[songsIndex + 1];
            if (nextSong) {
                playMusic(nextSong);
            }
        });
    }
    renderSongs()

    // function for my playlist
    function playSongs() {
        Array.from(document.getElementsByClassName('card')).forEach((e) => {
            e.addEventListener('click', async (item) => {
                await getSongs(`songs/${item.currentTarget.dataset.folder}`);
                playMusic(songs[0])
            })
        })
    }

    // // managing seekBar and functions
    document.querySelector('.seek-bar').addEventListener('click', (e) => {
        const percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100
        document.querySelector('.circle').style.left = percent + '%';
        currentSong.currentTime = ((currentSong.duration) * percent) / 100
    })

    // // mobile screen side menu bar functions
    document.querySelector('.side-menu-bar').addEventListener('click', () => {
        document.querySelector('.left-side-container').style.left = '0'
    })

    // mobile screen side menu bar close functon
    document.querySelector('.side-close-btn').addEventListener('click', () => {
        document.querySelector('.left-side-container').style.left = '-110%'
    })

    //search songs functions 
    const searchInput = document.querySelector(".search-bar");
    searchInput.addEventListener("input", () => {
        const inputValue = searchInput.value.toLowerCase();
        const allSongs = document.querySelectorAll('.songs-lis-ul li');

        allSongs.forEach((li) => {
            const songName = li.querySelector(".info div:first-child").innerText.toLowerCase();
            if (songName.includes(inputValue)) {
                li.style.display = "flex";
            } else {
                li.style.display = "none";
            }
        });
    });

    document.querySelector('#icon').addEventListener('click', () => {
        document.body.classList.toggle('light-theam');
        if (document.body.classList.contains('light-theam')) {
            document.querySelector('#icon').src = 'imgs/moon.svg'
        } else {
            document.querySelector('#icon').src = 'imgs/sun.svg'
        }
    })

    // login and singup
    document.querySelector(".login-btn").addEventListener('click', () => {
        const loginModal = document.querySelector('#loginModal');
        loginModal.classList.remove('hidden');
        document.querySelector('.close-btn').addEventListener('click', () => {
            loginModal.classList.add('hidden')
        })
    });


    document.querySelector(".signup-btn").addEventListener('click', () => {
        const signupModal = document.querySelector('#signupModal');
        signupModal.classList.remove('hidden');
        document.querySelector('.close').addEventListener('click', () => {
            signupModal.classList.add('hidden');
        })
    });


    document.querySelector('#account-singup').addEventListener('click', () => {
        const loginModal = document.querySelector('#loginModal');
        const signupModal = document.querySelector('#signupModal');
        loginModal.classList.add('hidden');
        signupModal.classList.remove('hidden');
    });

    document.querySelector('#account-login').addEventListener('click', () => {
        const loginModal = document.querySelector('#loginModal');
        const signupModal = document.querySelector('#signupModal');
        signupModal.classList.add('hidden');
        loginModal.classList.remove('hidden');
    });

    const loginBtn = document.querySelector('.login-btn');
    const signupBtn = document.querySelector('.signup-btn');
    const userIcon = document.querySelector('#user-icon');
    const singContainer = document.querySelector('.sing-container');
    const loginModal = document.querySelector('#loginModal');
    const signupModal = document.querySelector('#signupModal');

    const storedUser = JSON.parse(localStorage.getItem("userdetails"));
    const isLoggedIn = localStorage.getItem("isLoggedIn");

    if (storedUser && isLoggedIn === "true") {
        loginBtn.classList.add('hidden');
        signupBtn.classList.add('hidden');
        userIcon.classList.remove('hidden');

        singContainer.innerHTML = `
            <img src="imgs/close-profile.svg" class="cross-btn">
            <img src="imgs/user-logo.svg" class="profile-img">
            <h1>${storedUser.name}</h1>
            <p class="flex-display sing-p sing-out-btn">
                <img src="imgs/singout.svg" class="sing-out"> 
                <span>Sign out</span>
            </p>
        `;
    }
    // Login 
    document.querySelector('#loginForm').addEventListener('submit', (eve) => {
        eve.preventDefault();
        const userName = document.querySelector('#user-name').value.trim();
        const userPassword = document.querySelector('#user-password').value.trim();

        if (storedUser.inputUserName === userName || storedUser.userEmail === userName && storedUser.userFirstPassword === userPassword) {
            loginBtn.classList.add('hidden');
            signupBtn.classList.add('hidden');
            userIcon.classList.remove('hidden');

            singContainer.innerHTML = `
                <img src="imgs/close-profile.svg" class="cross-btn">
                <img src="imgs/user-logo.svg" class="profile-img">
                <h1>${storedUser.name}</h1>
                <p class="flex-display sing-p sing-out-btn">
                    <img src="imgs/singout.svg" class="sing-out"> 
                    <span>Sign out</span>
                </p>
            `;

            localStorage.setItem("isLoggedIn", "true");
            loginModal.classList.add('hidden');
            alert(`${storedUser.name}, you are logged in`);
        } else {
            alert(`Incorrect username or password!`);
        }
    });

    // Signup 
    document.querySelector('#signupForm').addEventListener('submit', (eve) => {
        eve.preventDefault();
        const name = document.querySelector('#user-input-name').value;
        const inputUserName = document.querySelector('#input-username').value;
        const userEmail = document.querySelector('#user-email').value;
        const userFirstPassword = document.querySelector('#user-first-password').value;
        const userConfirmPassword = document.querySelector('#user-confirm-password').value;

        if (userConfirmPassword !== userFirstPassword) {
            alert('Passwords do not match');
            return;
        }

        const user = {
            name,
            inputUserName,
            userEmail,
            userFirstPassword,
            userConfirmPassword
        };

        localStorage.setItem("userdetails", JSON.stringify(user));
        alert('Signup successful! Please log in.');
        signupModal.classList.add('hidden');
        loginModal.classList.remove('hidden');
    });

    document.addEventListener('click', (e) => {
        if (e.target.closest('.sing-out-btn')) {
            localStorage.removeItem("isLoggedIn");
            location.reload();
        }
    });

    document.querySelector(".login-btn").addEventListener('click', () => {
        loginModal.classList.remove('hidden');
    });

    document.querySelector(".signup-btn").addEventListener('click', () => {
        signupModal.classList.remove('hidden');
    });

    document.querySelector('.close-btn').addEventListener('click', () => {
        loginModal.classList.add('hidden');
    });

    document.querySelector('.close').addEventListener('click', () => {
        signupModal.classList.add('hidden');
    });

    document.querySelector('#account-singup').addEventListener('click', () => {
        loginModal.classList.add('hidden');
        signupModal.classList.remove('hidden');
    });

    document.querySelector('#account-login').addEventListener('click', () => {
        signupModal.classList.add('hidden');
        loginModal.classList.remove('hidden');
    });

    document.querySelector('#user-icon').addEventListener('click', () => {
        console.log('clicked')
        const singContainer = document.querySelector('.sing-container');
        singContainer.classList.add('show');
        singContainer.classList.remove('hidden');
        document.querySelector('.cross-btn').addEventListener('click', () => {
            singContainer.classList.remove('show');
            setTimeout(() => {
                singContainer.classList.add('hidden');
            }, 300);
        });
    });







})