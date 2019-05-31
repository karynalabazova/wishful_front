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

let sendToBack = (nick,password,adress) =>  (
  fetch (`http://localhost:4000/${adress}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({username: nick, password: password})
  }).then(res => res.json())
  // .then(json => (authToken = json.token,
  // authNick = json.nick,
  // history.push('/lists'))
)

class LoginPage extends Component {
  constructor(props){
    super(props);
    this.logIn = this.logIn.bind(this);
    this.state = {nick: null, password: null};
  }
  async logIn (nick, password) {
    await store.dispatch(makePromiseActions('login',sendToBack(nick, password,"login"))())
    history.push('/lists')
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
                onClick={()=> this.logIn(this.state.nick,this.state.password)}/>
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

  async join (nick, password) {
  if  (this.state.password === this.state.passwordCheck){
    await store.dispatch(makePromiseActions('join',
      sendToBack(nick, password,"join"))())
    await store.dispatch(makePromiseActions('login',sendToBack(nick, password,"login"))())
    history.push('/lists')
  }else this.setState({correct:false})
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

let getFromBack = (nick) =>  (
  fetch (`http://localhost:4000/lists/${nick}`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + `${store.getState().promises.login.data.token}`
    }
    }).then(response => response.json())

)

let deleteFromBack = (nick,itemText) =>  (
  fetch (`http://localhost:4000/delete/${nick}/${itemText}`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + `${store.getState().promises.login.data.token}`
    }
    }).then(response => response.json())

)

let createItem  = (nick,title) => (
  fetch (`http://localhost:4000/lists/${nick}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + `${store.getState().promises.login.data.token}`
    },
    body: JSON.stringify({title: title})
  }).then(res => res.json())
)

function List (props){
  return(
    <article className = "listName">
      <button onClick = {() => props.deleteFunction(props.itemText)}>
        <FontAwesomeIcon icon="times"/>
      </button>
      <span className="listTitleSpan">{props.itemText}</span>
      <Link to= {{ pathname: `/list/${props.itemText}`,
                   state: {listTitle: props.itemText}
                 }} >
      <FontAwesomeIcon icon="chevron-right"/></Link>
    </article>
  )
}

class ListsPage extends Component{
  constructor(props){
    super(props);

    this.state = {
      modalIsOpen: false,
      data:[],
      isFetching: true,
      title: ""
    };

    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.createList = this.createList.bind(this);
    this.deleteList = this.deleteList.bind(this);
  }
  async componentWillMount(){
    Modal.setAppElement('body')
    await store.dispatch(makePromiseActions('getLists',getFromBack(
      this.props.data.login.data.nick))())
    this.setState({isFetching : false})
  }

  openModal() {
    this.setState({modalIsOpen: true});
  }

  closeModal() {
    this.setState({modalIsOpen: false});
  }
  async createList(){
    await store.dispatch(makePromiseActions('createList',createItem(
      this.props.data.login.data.nick,
      this.state.title))())
    this.setState({title: "",isFetching : true})
    this.closeModal()
    await store.dispatch(makePromiseActions('getLists',getFromBack(
      this.props.data.login.data.nick))())
    this.setState({isFetching : false})
    window.scrollTo(0, 0)
  }
  async deleteList(value){
    await store.dispatch(makePromiseActions('deleteList', deleteFromBack(
      this.props.data.login.data.nick,
      value))())
    this.setState({isFetching : true})
    this.closeModal()
    await store.dispatch(makePromiseActions('getLists',getFromBack(
      this.props.data.login.data.nick))())
    this.setState({isFetching : false})
    window.scrollTo(0, 0)
  }
  render(){
    const {isFetching} = this.state;
    if (isFetching) return <div>...Loading</div>;
    return(
      <div className="userPageWrapper">
        <section className="userPage">
          <div className="sideBar">
            <h2> Hello, {this.props.data.login.data.nick}!</h2>
            <button onClick={this.openModal}>
              <FontAwesomeIcon icon="plus"/>
            </button>
            <Modal
              isOpen={this.state.modalIsOpen}
              onRequestClose={this.closeModal}
              style={customStyles}
              contentLabel="Example Modal">
              <input type="text" placeholder="Title" className="listTitle"
              onChange ={event =>
                this.setState({title: event.target.value})}/>
              <button onClick={this.createList} className="addList">
                <FontAwesomeIcon icon="plus"/>
              </button>
            </Modal>
          </div>
          <div className="listsBar" >
            {this.props.data.getLists.data.reverse().map(x =>
            <List className="listName" deleteFunction ={this.deleteList} value = {x.title} itemText={x.title} key = {Math.random()}></List>)}
          </div>
        </section>
      </div>
    )
  }
}

let mapStateToProps = state => ({data: state.promises})
let ConnectedLists = connect(mapStateToProps)(ListsPage)

class ListItemsPage extends Component{
  constructor(props){
    super(props);

    this.state = {
      modalIsOpen: false,
      data: [],
      isFetching: true,
      title: ""
    };

    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
  }
  componentWillMount(){
    Modal.setAppElement('body')
    console.log(this.props.location.pathname)
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
            <h2> {this.props.location.state.listTitle} </h2>
            <button onClick={this.openModal}>
              <FontAwesomeIcon icon="plus"/>
            </button>
            <Modal
              isOpen={this.state.modalIsOpen}
              onRequestClose={this.closeModal}
              style={customStyles}
              contentLabel="Example Modal">
              <input type="text" placeholder="text" className="listTitle listItem"
              onChange ={event =>
                this.setState({title: event.target.value})}/>
              <button onClick={this.closeModal} className="addList">
                <FontAwesomeIcon icon="plus"/>
              </button>
            </Modal>
          </div>
          <div className="listsBar">
          {this.props.data.getLists.data.map(x =>
            `/list/${x.title}` === this.props.location.pathname ?
              x.items.map(x => <Item className="itemBar" itemText={x.text} key = {Math.random()}></Item>) :
                null
            )}
          </div>
        </section>
        <ShareButtons/>
      </div>
    )
  }
}
mapStateToProps = state => ({data: state.promises})
let ConnectedListItems = connect(mapStateToProps)(ListItemsPage)

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
    if (!store.getState.login) history.push('/')
    return (
      <Provider store = {store} >
        <div className="App">
          <Router history = {history}>
            <Route path="/" component = { LoginPage } exact />
            <Route path="/join" component = { CreateAccountPage } />
            <Route path="/lists" component = { ConnectedLists } />
            <Route path="/list/:listName" component = { ConnectedListItems } />
          </Router>
        </div>
      </Provider>
    );
  }
}

export default App;
