import React, { Component } from 'react';
import './App.css';
import { Router, Route, Link } from "react-router-dom";
import history from "./history";
import GoogleLogin from 'react-google-login';
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faChevronRight, faTimes, faArrowLeft} from '@fortawesome/free-solid-svg-icons'
import Linkify from 'react-linkify';

import Modal from 'react-modal';
import {FacebookShareButton,FacebookIcon,
        TwitterShareButton,TwitterIcon,
        TelegramShareButton,TelegramIcon,
        EmailShareButton,EmailIcon
} from 'react-share';
import jwt_decode from 'jwt-decode';
import {Provider, connect}   from 'react-redux';
import {createStore} from 'redux';
import thunk from 'redux-thunk';
const applyMiddleware = require("redux").applyMiddleware


library.add(faPlus, faChevronRight, faTimes,  faArrowLeft)
const customStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)',
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
    .catch(err => err.json())
)

class LoginPage extends Component {
  constructor(props){
    super(props);
    this.state = {
      noName: false,
      noPass: false,
      nick: null,
      password: null,
      err: false,
      empty: false,
      data:[]
    }

    this.logIn = this.logIn.bind(this);
  }
  async logIn (nick, password) {
      if (this.state.nick === null || this.state.password === null){
        this.setState({empty: true})
      } else{
        await store.dispatch(makePromiseActions('login',sendToBack(nick, password,"login"))())
        if (this.props.data.login.data.message){
              this.setState({err: true})
        } else history.push('/lists')
      }
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
                className={this.state.noName ? 'incorrectInput' : 'listTitle'}
                onChange ={event =>
                  this.setState({nick: event.target.value, noName: false,
                    err: false, empty:false})}/>
              <input type="password" placeholder="password"
                className={this.state.noPass ? 'incorrectInput' : 'listTitle'}
                onChange ={event =>
                  this.setState({password: event.target.value, noPass: false,
                    err: false, empty:false})}/>
              <p className={this.state.err ? 'incorrect' : 'hide'}>
                Username or password is incorrect!</p>
              <p className={this.state.empty ? 'incorrect' : 'hide'}>
                  Enter username & password!</p>
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
let mapStateToProps = state => ({data: state.promises})
let ConnectedLogIn = connect(mapStateToProps)(LoginPage)

class CreateAccountPage extends Component{
  constructor(props){
    super(props);
    this.join = this.join.bind(this)
    this.state = {nick: null,
                  password: null,
                  passwordCheck: null,
                  correct: true,
                  exists: false,
                  empty: false,
                  data:[]}
  }

  async join (nick, password) {
  if (this.state.password === null || this.state.passwordCheck === null
      || this.state.nick === null){
      this.setState({empty: true})
  } else {
    if  (this.state.password === this.state.passwordCheck){
      await store.dispatch(makePromiseActions('join',
        sendToBack(nick, password,"join"))())
        if (this.props.data.join.data.message){
          this.setState({exists: true})
        } else {
          await store.dispatch(makePromiseActions('login',sendToBack(nick, password,"login"))())
          history.push('/lists')
        }
    }else this.setState({correct:false})
    }
  }


  render(){
    return(
      <section className="mainPage">
        <div className="loginForm">
            <form className="join">
              <h2> Join <span>Wishful</span></h2>
              <input type="text" placeholder="username"
                className = 'listTitle'
                onChange ={event =>
                  this.setState({nick: event.target.value, exists: false, empty:false})}/>
              <p className={this.state.exists ? 'incorrect' : 'hide'}>
                User already exists!</p>
              <input type="password" placeholder="password"
                className = {this.state.correct ? 'listTitle' : 'incorrect'}
                onChange ={event =>
                  this.setState({password: event.target.value, empty:false})}/>
              <input type="password" placeholder="* confirm password"
                className = {this.state.correct ? 'listTitle' : 'incorrect'}
                onChange ={event =>
                  this.setState({passwordCheck: event.target.value, correct: true, empty:false})}/>
              <p className={this.state.correct ? 'hide' : 'incorrect'}>
                Passwords don`t match!</p>
              <p className={this.state.empty ? 'incorrect' : 'hide'}>
                    Enter username & password!</p>
              <input type="button" value="Create!"
                onClick={()=>this.join(this.state.nick,this.state.password)}/>
            </form>
        </div>
      </section>
    )
  }
}

mapStateToProps = state => ({data: state.promises})
let ConnectedCreate = connect(mapStateToProps)(CreateAccountPage)

let getLists = (id) =>  (
  fetch (`http://localhost:4000/lists/${id}`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + `${store.getState().promises.login.data.token}`
    }
    }).then(response => response.json())
)

let createList  = (id,title,shareWith) => (
  fetch (`http://localhost:4000/lists/${id}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + `${store.getState().promises.login.data.token}`
    },
    body: JSON.stringify({title: title, shareWith: shareWith})
  }).then(res => res.json())
    .catch(err => err.json())
)

let deleteList = (nick,itemText) =>  (
  fetch (`http://localhost:4000/delete/${nick}/${itemText}`, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + `${store.getState().promises.login.data.token}`
    }
    }).then(response => response.json())

)

function List (props){
  return(
    <article className = "listName">
      <button className = {props.own  ? null: "hide"}
        onClick = {() => props.deleteFunction(props.itemText)}>
        <FontAwesomeIcon icon="times"/>
      </button>
      { props.ownerNick ?
          <span>{props.ownerNick}</span> : null}
      <span className="listTitleSpan">{props.itemText}</span>
      <Link to= {{ pathname: `/list/${props.itemText}`,
                   state: {listTitle: props.itemText, owner: props.owner}
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
      title: "",
      shareWith:[],
      own: true,
      noTitle : false,
      noReaders: false,
      err: false
    };

    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.createList = this.createList.bind(this);
    this.deleteList = this.deleteList.bind(this);
  }
  async componentWillMount(){
    Modal.setAppElement('body')
    await store.dispatch(makePromiseActions('getLists',getLists(
      jwt_decode(this.props.data.login.data.token).sub))())
    this.setState({isFetching : false})
  }
  openModal() {
    this.setState({modalIsOpen: true});
  }

  closeModal() {
    this.setState({modalIsOpen: false, noReaders: false, shareWith:[],
      title: "", noTitle : false});
  }
  async createList(){
    if (this.state.title){
      await store.dispatch(makePromiseActions('createList',createList(
        jwt_decode(this.props.data.login.data.token).sub,
        this.state.title,
        this.state.shareWith))())

      if (this.props.data.createList.data.message){
        this.setState({err: true})
      } else {
        this.setState({title: "",shareWith:[],isFetching : true})
        this.closeModal()

        await store.dispatch(makePromiseActions('getLists',getLists(
          jwt_decode(this.props.data.login.data.token).sub))())

        this.setState({isFetching : false, own: true})
        window.scrollTo(0, 0)
      }
    } else this.setState({noTitle: true})

  }
  async deleteList(value){
    await store.dispatch(makePromiseActions('deleteList', deleteList(
      this.props.data.login.data.nick,
      value))())
    this.setState({isFetching : true})
    this.closeModal()
    await store.dispatch(makePromiseActions('getLists',getLists(
      jwt_decode(this.props.data.login.data.token).sub))())
    this.setState({isFetching : false})
    window.scrollTo(0,0)
  }
  render(){
    const {isFetching} = this.state;
    if (isFetching) return <div>...Loading</div>;
    return(
      <div className="userPageWrapper">
        <section className="userPage">
          <div className="sideBar">
            <h2> Hello, {this.props.data.login.data.nick}!</h2>
            <button onClick={this.openModal} className={this.state.own ? null: "hide" }>
              <FontAwesomeIcon icon="plus"/>
            </button>
            <Modal
              isOpen={this.state.modalIsOpen}
              onRequestClose={this.closeModal}
              style={customStyles}
              contentLabel="Example Modal">
              <input type="text" placeholder="Title" className={this.state.noTitle ?
                'incorrectInput' : "listTitle"}
              onChange ={event =>
                this.setState({title: event.target.value, noTitle: false, err:false})}/>
                <p className={this.state.noTitle ? 'incorrect' : 'hide'}>
                  Please, enter title!</p>
              <p className = "share">Share with:</p>
              <input type="text" placeholder="username"
                className={this.state.noReaders? 'incorrectInput' : 'listTitle'}
                ref={el => this.input = el}
                onChange ={event =>
                  this.setState({noReaders: false})}/>
              <p className={this.state.err ? 'incorrect' : 'hide'}>
                  List already exists!</p>
              <button className="addReader addList"
                onClick={e => (this.input.value ?
                  (this.setState({shareWith:[...this.state.shareWith, this.input.value]}),
                  this.input.value = "") :
                    this.setState({noReaders:true}))}>
                <FontAwesomeIcon icon="plus"/>
              </button>
              <div className="readersList">{this.state.shareWith.map(x =>
                <span key={Math.random()}>{x}, </span>)}</div>
              <button className="addList sendlist" onClick={this.createList}>
                Add list
              </button>
            </Modal>
          </div>
          <div className="buttons">
            <button className={this.state.own ? "activeButton" : "button"}
              onClick = {event => this.setState({own: true})}>My lists</button>
            <button className={!this.state.own ? "activeButton" : "button"}
              onClick = {event => this.setState({own: false})}>Friends` lists</button>
          </div>
          <div className="listsBar" >
          { this.state.own === true ?
            (this.props.data.getLists.data.OwnList.map(x =>
            <List className="listName" deleteFunction ={this.deleteList}
              value = {x.title} itemText={x.title} key = {x._id}
                owner ={x.owner} own = {this.state.own}></List>)) :
            (this.props.data.getLists.data.OtherLists.map(x =>
            <List className="listName" deleteFunction ={this.deleteList}
              value = {x.title} itemText={x.title} key = {x._id}
                owner ={x.owner._id} ownerNick = {x.owner.nick} own = {this.state.own}></List>))
              }
          </div>
        </section>
      </div>
    )
  }
}

mapStateToProps = state => ({data: state.promises})
let ConnectedLists = connect(mapStateToProps)(ListsPage)

let handleItem  = (link,nick,list,title) => (
  fetch (`http://localhost:4000/${link}/${nick}/${list}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + `${store.getState().promises.login.data.token}`
    },
    body: JSON.stringify({title: title})
  }).then(response => response.json())
    .catch(err => err.json())
)

let getItemsFromBack = (nick,list) => (
  fetch (`http://localhost:4000/lists/${nick}/${list}`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + `${store.getState().promises.login.data.token}`
    }
  }).then(res => res.json())
)

class ListItemsPage extends Component{
  constructor(props){
    super(props);

    this.state = {
      modalIsOpen: false,
      data: [],
      isFetching: true,
      title: "",
      own: true,
      noTitle: false,
      err: false
    };

    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.createItem = this.createItem.bind(this);
    this.checkItem = this.checkItem.bind(this);
  }
  async componentWillMount(){
    Modal.setAppElement('body')
    if (this.props.location.state.owner !== jwt_decode(this.props.data.login.data.token).sub){
      this.setState({own: false})
    }
    await store.dispatch(makePromiseActions('getItems',getItemsFromBack(
      this.props.location.state.owner,
      this.props.location.state.listTitle))())
    this.setState({isFetching: false})
  }

  openModal() {
    this.setState({modalIsOpen: true});
  }

  closeModal() {
    this.setState({modalIsOpen: false, noTitle: false});
  }

  async createItem(){
    if (this.state.title){
      let err = this.props.data.getItems.data.find(x => x.text === this.state.title)
      if (err){
        this.setState({err:true})
      } else{
        await store.dispatch(makePromiseActions('createItem',handleItem(
          "lists",
          this.props.data.login.data.nick,
          this.props.location.state.listTitle,
          this.state.title))())

          this.setState({title: "",isFetching : true})
          this.closeModal()

          await store.dispatch(makePromiseActions('getItems',getItemsFromBack(
            this.props.location.state.owner,
            this.props.location.state.listTitle))())

          this.setState({isFetching : false})
          window.scrollTo(0, 0)
      }
    } else this.setState({noTitle: true})
  }
  async checkItem(value){
    await store.dispatch(makePromiseActions('createItem',handleItem(
      "check",
      this.props.location.state.owner,
      this.props.location.state.listTitle,
      value))())
    this.setState({isFetching : true})
    this.closeModal()
    await store.dispatch(makePromiseActions('getItems',getItemsFromBack(
      this.props.location.state.owner,
      this.props.location.state.listTitle))())
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
          <button
              onClick={e => history.push('/lists')}>
            <FontAwesomeIcon icon="arrow-left"/>
          </button>
            <h2> {this.props.location.state.listTitle} </h2>
            {this.state.own ?
              <button
                  onClick={this.openModal}>
                <FontAwesomeIcon icon="plus"/>
              </button> : null}
            <Modal
              isOpen={this.state.modalIsOpen}
              onRequestClose={this.closeModal}
              style={customStyles}
              contentLabel="Example Modal">
              <textarea type="text" placeholder="text"
                className={this.state.noTitle ? 'incorrectInput' : "listTitle listItem"}
                onChange ={event =>
                  this.setState({title: event.target.value, noTitle: false, err: false})}/>
              <button onClick={this.createItem} className="addList addReader ">
                <FontAwesomeIcon icon="plus"/>
              </button>
              <p className={this.state.noTitle ? 'incorrect' : 'hide'}>
                Please, enter text!</p>
              <p className={this.state.err ? 'incorrect' : 'hide'}>
                  Item already exists!</p>
            </Modal>
          </div>
          <div className="listsBar">
          {this.props.data.getItems.data.map(x =>
            <Item className="itemBar" checkFunction={this.checkItem}
              checked ={x.checked} itemText={x.text} key = {Math.random()}></Item>)}
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
      <input type = "checkbox" checked = {props.checked}
        onChange={() => props.checkFunction(props.itemText)}/>
      <Linkify properties={{target: '_blank'}}>{props.itemText}</Linkify>
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
            <Route path="/" component = { ConnectedLogIn } exact />
            <Route path="/join" component = { ConnectedCreate } />
            <Route path="/lists" component = { ConnectedLists } />
            <Route path="/list/:listName" component = { ConnectedListItems } />
          </Router>
        </div>
      </Provider>
    );
  }
}

export default App;
