const {BrowserWindow, app} = require("electron");
const pie = require("puppeteer-in-electron")
const puppeteer = require("puppeteer-core");


let username = '2024blockout_ar';
const main = async () => {
    await pie.initialize(app);

    const browser = await pie.connect(app, puppeteer);
    const win = new BrowserWindow();


    const url = `https://www.instagram.com/accounts/login/?next=https%3A%2F%2Finstagram.com%2F${username}%2Ffollowing%2F`;
    await win.loadURL(url);


    // open the dev tools
    // window.webContents.openDevTools();
    const page = await pie.getPage(browser, win);
    page.setDefaultNavigationTimeout(0);
    console.log(page.url());
    if (page.url() === 'https://www.instagram.com/') {
        console.log('Logged in successfully');
        await blockout(page);
    }else{
        console.log('Not logged in');
        // wait for the user to log in
        await page.waitForNavigation();
        console.log('Logged in successfully');
        await blockout(page);
    }


    // window.destroy();
};

main();

// block the user with random time delay
const block = async (page, username) => {
    console.log(`Blocking user: ${username}`);
    await page.goto(`https://www.instagram.com/${username}/`);

    // get the element that contains "Options" and click on it
    await page.waitForSelector('[aria-label="Options"]');
    await page.click('[aria-label="Options"]');

    // get the element that contains "Block" and click on it
    await page.waitForSelector('button');
    await clickButtonByText(page, 'Block');
    await wait(5000);
    await clickButtonByText(page, 'Block');
}

const clickButtonByText = async (page, text) => {
    await page.waitForSelector('button');
    // foreach on all buttons and click on the one that contains "Block"
    const buttons = await page.$$('button');
    console.log(buttons)
    for (const button of buttons) {
        const buttonText = await page.evaluate(element => element.textContent, button);
        if (buttonText === text) {
            await button.click();
            // remove the button from the DOM
            page.evaluate(element => element.remove(), button);
            break;
        }
    }
}

const wait = async (ms) => {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

// get all the users in the following list
const blockout = async (page) => {
    page.goto(`https://www.instagram.com/${username}/following/`).then(async () => {
        console.log('click on the button "following"');
        await page.waitForSelector(`a[href="/${username}/following/"]`);
        await page.click(`a[href="/${username}/following/"]`);
        console.log('scrolling down in the following list ._aano');
        const scrollable_section = '._aano';

        await page.waitForSelector(scrollable_section);

        const usernames = await page.evaluate(async (selector) => {
            let users = [];
            let previousHeight = 0;
            let sameHeightCount = 0;
            const maxSameHeightCount = 10; // Number of iterations to confirm the end of scrolling

            return new Promise((resolve) => {
                const scrollAndCollect = setInterval(() => {
                    const element = document.querySelector(selector);
                    const currentHeight = element.scrollHeight;
                    element.scrollTop = currentHeight;

                    if (currentHeight === previousHeight) {
                        sameHeightCount++;
                    } else {
                        sameHeightCount = 0;
                    }

                    previousHeight = currentHeight;

                    if (sameHeightCount >= maxSameHeightCount) {
                        clearInterval(scrollAndCollect);
                        document.querySelectorAll(selector + ' [href] span').forEach((element) => {
                            users.push(element.innerText);
                        });
                        resolve(users);
                    }
                }, 1000);
            });
        }, scrollable_section);

        console.log(usernames);

        // block the user
        // await block(page, usernames[0]);
        // block users
        for (const user of usernames) {
            await block(page, user);
            await wait(rand(5000, 50000));
        }
    });
}

// generate random number between min and max
function rand(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

