<!-- PROJECT LOGO -->
<br />
<div align="center">
  <h2 align="center">Chat App</h2>

  <p align="center">
    An open-source web chat application
    <br />
    <br />
    <a href="https://github.com/dig0w/chat-app">View Demo</a>
  </p>
</div>



<!-- Index -->
<details>
  <summary>Index</summary>
  <ol>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
  </ol>
</details>


<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

To install the server packages:
* npm
  ```sh
  cd server
  npm install
  ```


To install the client packages:
* npm
  ```sh
  cd client
  npm install
  ```

### Installation

1. Create a .env file inside server folder

2. Create MongoDB Cluster

3. Inside .env file
  ```env
  DB_USER = MongoDB Username
  DB_PASS = MongoDB Password
  ```

4. For the sign in verification you need an email and an application key
  ```env
  EMAil = Email
  PASS = Email Application Key
  ```

5. Get a free Token Key at [https://jwt.io](https://jwt.io)
  ```env
  JWT_SECRET = Token Key
  ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ABOUT THE PROJECT -->
## About The Project

### Built With

This application uses:

* [![MongoDB][MongoDB.com]][MongoDB-url]
* [![ExpressJS][ExpressJS.com]][ExpressJS-url]
* [![React][React.js]][React-url]
* [![NodeJS][NodeJS.org]][NodeJS-url]
* [![Socket][Socket.io]][Socket-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

- [ ] Edit profile
- [ ] Edit chats
- [ ] Edit messages
    - [ ] Forward
    - [ ] Reply
    - [ ] React

See the [open issues](https://github.com/dig0w/chat-app/issues) for a full list of proposed features (and known issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.txt` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

[@dig0w0224](https://twitter.com/dig0w0224) - dig0w.yt@gmail.com

Project Link: [https://github.com/dig0w/chat-app](https://github.com/dig0w/chat-app)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/othneildrew/Best-README-Template.svg?style=for-the-badge
[contributors-url]: https://github.com/othneildrew/Best-README-Template/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/othneildrew/Best-README-Template.svg?style=for-the-badge
[forks-url]: https://github.com/othneildrew/Best-README-Template/network/members
[stars-shield]: https://img.shields.io/github/stars/othneildrew/Best-README-Template.svg?style=for-the-badge
[stars-url]: https://github.com/othneildrew/Best-README-Template/stargazers
[issues-shield]: https://img.shields.io/github/issues/othneildrew/Best-README-Template.svg?style=for-the-badge
[issues-url]: https://github.com/othneildrew/Best-README-Template/issues
[license-shield]: https://img.shields.io/github/license/othneildrew/Best-README-Template.svg?style=for-the-badge
[license-url]: https://github.com/othneildrew/Best-README-Template/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/othneildrew
[product-screenshot]: images/screenshot.png
[MongoDB.com]: https://img.shields.io/badge/MongoDB-20232A?style=for-the-badge&logo=mongodb&logoColor=00FE69
[MongoDB-url]: https://www.mongodb.com/
[ExpressJS.com]: https://img.shields.io/badge/Express-20232A?style=for-the-badge&logo=express&logoColor=259DFF
[ExpressJS-url]: https://expressjs.com/
[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/
[NodeJS.org]: https://img.shields.io/badge/NodeJS-20232A?style=for-the-badge&logo=nodedotjs&logoColor=5FA04E
[NodeJS-url]: https://nodejs.org/
[Socket.io]: https://img.shields.io/badge/Socket-20232A?style=for-the-badge&logo=socketdotio&logoColor=FEFEFE
[Socket-url]: https://socket.io/
