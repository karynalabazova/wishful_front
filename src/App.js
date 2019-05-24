import React, { Component } from 'react';
import './App.css';
import { Router, Route, Link, Redirect } from "react-router-dom";
import history from "./history";
import GoogleLogin from 'react-google-login';
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faChevronRight, faTimes} from '@fortawesome/free-solid-svg-icons'
import ReactDOM from 'react-dom';
import Modal from 'react-modal';
import {FacebookShareButton,FacebookIcon,
        TwitterShareButton,TwitterIcon,
        TelegramShareButton,TelegramIcon,
        EmailShareButton,EmailIcon
} from 'react-share';
import {Provider, connect}   from 'react-redux';
import {createStore} from 'redux';
import thunk from 'redux-thunk';
const applyMiddleware = require("redux").applyMiddleware

library.add(faPlus, faChevronRight, faTimes)
const customStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)'
  }
};

let store = createStore((state, action) => {
  if(!state){
    return {promises: {}}
  }
  if(action.type === 'PROMISE' && action.name){
    return { promises: {...state.promises,
                          [action.name]: {
                            status: action.status,
                            error: action.error,
                            data: action.data
                          }}}
  }
  return state;
}, applyMiddleware(thunk))

store.subscribe(()=> console.log(store.getState()))

function makePromiseActions(name,promise){
  const actionPending     = () => ({ name, type: 'PROMISE', status: 'PENDING', data: null, error: null, value:"" })
  const actionResolved    = data => ({ name, type: 'PROMISE', status: 'RESOLVED', data, error: null, value: "" })
  const actionRejected    = error => ({ name, type: 'PROMISE', status: 'REJECTED', data: null, error, value: "" })

  function actionPromise(){
    return async function (dispatch){
      dispatch(actionPending())
      try{
        dispatch(actionResolved(await promise))
      }
      catch(e){
        dispatch (actionRejected(e))
      }
    }
  }
  return actionPromise
}
let authToken

let sendToBack = (nick,password,adress) =>  (
  fetch (`http://localhost:4000/${adress}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({username: nick, password: password})
  }).then(res => res.json())
    .then(json =>history.push('/lists'))
)

class LoginPage extends Component{
  constructor(props){
    super(props);
    this.logIn = this.logIn.bind(this)
    this.state = {nick: null, password: null}
  }

  logIn (nick, password) {
    store.dispatch(makePromiseActions('login',sendToBack(nick, password,"login"))())
  }

  render(){

    const responseGoogle = (response) => {
      console.log(response);
    }
    return(
      <section className="mainPage">
        <div className="loginForm">
            <form className="login">
              <h2>Welcome to <span>Wishful</span></h2>
              <p>please login to continue</p>
              <input type="text" placeholder="username"
                onChange ={event =>
                  this.setState({nick: event.target.value})}/>
              <input type="password" placeholder="password"
                onChange ={event =>
                  this.setState({password: event.target.value})}/>
              <input type="button" value="GO!"
                onClick={()=>
                  this.logIn(this.state.nick,this.state.password)}/>
            </form>
            <p> or </p>
            <div className="createAccount">
              <GoogleLogin className="googleLogin"
                clientId=""
                buttonText="LOGIN WITH GOOGLE"
                onSuccess={responseGoogle}
                onFailure={responseGoogle}/>
            </div>
            <Link to='/join'> Create an Account </Link>
        </div>
      </section>
    )
  }
}

class CreateAccountPage extends Component{
  constructor(props){
    super(props);
    this.join = this.join.bind(this)
    this.state = {nick: null, password: null, passwordCheck: null,
      correct: true}
  }

  join (nick, password) {
    this.state.password === this.state.passwordCheck ?
      store.dispatch(makePromiseActions('join',
        sendToBack(nick, password,"join"))()) :
          this.setState({correct:false})
  }

  render(){
    return(
      <section className="mainPage">
        <div className="loginForm">
            <form className="join">
              <h2> Join <span>Wishful</span></h2>
              <input type="text" placeholder="username"
                onChange ={event =>
                  this.setState({nick: event.target.value})}/>
              <input type="password" placeholder="password"
                className = {this.state.correct ? null : 'incorrect'}
                onChange ={event =>
                  this.setState({password: event.target.value})}/>
              <input type="password" placeholder="* confirm password"
                className = {this.state.correct ? null : 'incorrect'}
                onChange ={event =>
                  this.setState({passwordCheck: event.target.value})}/>
              <p className={this.state.correct ? 'correct' : 'incorrect'}>
                passwords don`t match</p>
              <input type="button" value="Create!"
                onClick={()=>this.join(this.state.nick,this.state.password)}/>
            </form>
        </div>
      </section>
    )
  }
}

class ListsPage extends Component{
  constructor(props){
    super(props);

    this.state = {
      modalIsOpen: false
    };

    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }
  componentWillMount(){
    Modal.setAppElement('body')
  }

  openModal() {
    this.setState({modalIsOpen: true});
  }

  closeModal() {
    this.setState({modalIsOpen: false});
  }

  render(){
    return(
      <div className="userPageWrapper">
        <section className="userPage">
          <div className="sideBar">
            <h2> Hello, User!</h2>
            <button onClick={this.openModal}>
              <FontAwesomeIcon icon="plus"/>
            </button>
            <Modal
              isOpen={this.state.modalIsOpen}
              onRequestClose={this.closeModal}
              style={customStyles}
              contentLabel="Example Modal">
              <input type="text" placeholder="Title" className="listTitle"/>
              <button onClick={this.closeModal} className="addList">
                <FontAwesomeIcon icon="plus"/>
              </button>
            </Modal>
          </div>
          <div className="listsBar">
            <List className="listName" itemText="List name"></List>
          </div>
        </section>
      </div>
    )
  }
}

class ListItemsPage extends Component{
  constructor(props){
    super(props);

    this.state = {
      modalIsOpen: false
    };

    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }
  componentWillMount(){
    Modal.setAppElement('body')
  }

  openModal() {
    this.setState({modalIsOpen: true});
  }

  closeModal() {
    this.setState({modalIsOpen: false});
  }

  render(){
    return(
      <div className="userPageWrapper">
        <section className="userPage">
          <div className="sideBar">
            <h2> List Name </h2>
            <button onClick={this.openModal}>
              <FontAwesomeIcon icon="plus"/>
            </button>
            <Modal
              isOpen={this.state.modalIsOpen}
              onRequestClose={this.closeModal}
              style={customStyles}
              contentLabel="Example Modal">
              <input type="text" placeholder="text" className="listTitle listItem"/>
              <button onClick={this.closeModal} className="addList">
                <FontAwesomeIcon icon="plus"/>
              </button>
            </Modal>
          </div>
          <div className="listsBar">
            <Item className="itemBar" itemText="List item"></Item>
          </div>
        </section>
        <ShareButtons/>
      </div>
    )
  }
}
function ShareButtons (props){
  const shareUrl = window.location.href;
  return(
    <div className="shareButtons">
      <FacebookShareButton url={shareUrl}>
        <FacebookIcon size={32} round={true} />
      </FacebookShareButton>
      <TwitterShareButton url={shareUrl}>
        <TwitterIcon size={32} round={true} />
      </TwitterShareButton>
      <TelegramShareButton url={shareUrl}>
        <TelegramIcon size={32} round={true} />
      </TelegramShareButton>
      <EmailShareButton url={shareUrl}>
        <EmailIcon size={32} round={true} />
      </EmailShareButton>
    </div>
  )
}

function List (props){
  return(
    <article className = "listName">
      <button>
        <FontAwesomeIcon icon="times"/>
      </button>
      <span>{props.itemText}</span>
      <Link to='/list'><FontAwesomeIcon icon="chevron-right"/></Link>
    </article>
  )
}

function Item (props){
  return(
    <article className = "itemBar">
      <input type= "checkbox"/><span>{props.itemText}</span>
    </article>
  )
}

function AddList (props){
  return(
    <article className = "listName">
      <input type="text"/>
      <Link to='/join'><FontAwesomeIcon icon="plus"/></Link>
    </article>
  )
}


class App extends Component {
  render() {
    if (!authToken) history.push('/')
    return (
      <div className="App">
        <Router history = {history}>
          <Route path="/" component = { LoginPage } exact />
          <Route path="/join" component = { CreateAccountPage } />
          <Route path="/lists" component = { ListsPage } />
          <Route path="/list" component = { ListItemsPage } />
        </Router>
      </div>
    );
  }
}

export default App;
