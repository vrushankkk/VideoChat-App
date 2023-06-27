import Button from "@material-ui/core/Button"
import IconButton from "@material-ui/core/IconButton"
import TextField from "@material-ui/core/TextField"
import AssignmentIcon from "@material-ui/icons/Assignment"
import PhoneIcon from "@material-ui/icons/Phone"
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardHeader from '@mui/material/CardHeader';
import React, { useEffect, useRef, useState } from "react"
import { CopyToClipboard } from "react-copy-to-clipboard"
import Peer from "simple-peer"
import io from "socket.io-client"
import "./App.css"
import WebCamAccess from './webcam_access_required.png'

const socketAddress = 'http://192.168.1.6:5000/';
const socket = io.connect(socketAddress)
function App() {
	const [ me, setMe ] = useState("")       					// my socket id
	const [ stream, setStream ] = useState() 					// refers to current video stream value undefined if no active video source
	const [ receivingCall, setReceivingCall ] = useState(false) // status of receiving call
	const [ caller, setCaller ] = useState("")				    // caller id
	const [ callerSignal, setCallerSignal ] = useState()		// current signal
	const [ callAccepted, setCallAccepted ] = useState(false)	// is call accepted?
	const [ idToCall, setIdToCall ] = useState("")				// callers id but typed
	const [ callEnded, setCallEnded] = useState(false)			// is call ended?
	const [ name, setName ] = useState("")						// my name
	const [ userName , setUserName] = useState("")
	const myVideo = useRef()									// ref to my video
	const userVideo = useRef()									// ref to client video
	const connectionRef= useRef()   							// connection Ref
	const [isEdit,setIsEdit] = useState(false)
	const [mainClass,toggleMainClass] = useState("main-container")
	useEffect(() => {
		navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
			setStream(stream)
				myVideo.current.srcObject = stream
		})

		socket.on("me", (id) => {
			setMe(id)
		})

		socket.on("callUser", (data) => {
			setReceivingCall(true)
			setCaller(data.from)
			setUserName(data.name)
			setCallerSignal(data.signal)
		})
	}, [])

	const callUser = (id) => {
		const peer = new Peer({
			initiator: true,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("callUser", {
				userToCall: id,
				signalData: data,
				from: me,
				name: name
			})
		})
		peer.on("stream", (stream) => {
				userVideo.current.srcObject = stream
		})
		socket.on("callAccepted", (data) => {
			setCallAccepted(true)
			setUserName(data.name)
			peer.signal(data.signal)
		})

		connectionRef.current = peer
	}

	const answerCall =() =>  {
		setCallAccepted(true)
		setReceivingCall(false)
		const peer = new Peer({
			initiator: false,
			trickle: false,
			stream: stream
		})
		peer.on("signal", (data) => {
			socket.emit("answerCall", { signal: data, to: caller,name: name })
		})
		peer.on("stream", (stream) => {
			userVideo.current.srcObject = stream
		})

		peer.signal(callerSignal)
		connectionRef.current = peer
	}
	useEffect(()=>{
		if(receivingCall){
			toggleMainClass("main-container main-container-opaque")
		}
		else{
			toggleMainClass("main-container")
		}
	},[receivingCall])
	const leaveCall = () => {
		setCallEnded(true)
		setIsEdit(false)
		setReceivingCall(false)
		console.log("hi")
		connectionRef.current.destroy()
	}
	const keyDownHandler = e =>{
		if(e.key === 'Enter'){
			e.preventDefault()
			setIsEdit(true)
		}
	}
	//
	return (
		<>
				{
			receivingCall && !callAccepted ?(
			<div className="answer-call">
				{ 
					<div className="caller">
						<h1 >{userName} is calling...</h1>
						<Button variant="contained" color="primary" onClick={answerCall}>
							Answer
						</Button>
					</div>
				}
			</div>
			):null
		}
		<div className={mainClass}>

		<h1 style={{ textAlign: "center", color: '#fff' }}>Video Calling App</h1>
		<div className="container">
			<div className="video-container">
				<div className="video">
					<Card  className="video-styles">
					      <CardHeader title={name}/>
								{stream && <CardMedia playsInline muted ref={myVideo} component={"video"} autoPlay height="194" />}
								{!stream && <img src={WebCamAccess} style={{width:"345px", height:"194px"}} alt="error" />}
					</Card>
					
				</div>
				<div className="video">
						<Card  className="video-styles">
							<CardHeader title={callAccepted && !callEnded ? userName || "Anonymous" : null}/>
								{ callAccepted && !callEnded ? 
								<CardMedia playsInline ref={userVideo} component={"video"} autoPlay height="194" />:
								<img src={WebCamAccess} style={{width:"345px", height:"194px"}} alt="error" />
								}
								
							</Card>
				</div>
			</div>
			<div className="myId">
				<TextField
					id="filled-basic"
					label="Name"
					variant="filled"
					value={name}
					onChange={(e) => setName(e.target.value)}
					style={{ marginBottom: "20px" }}
					disabled = {isEdit}
					onKeyDown={keyDownHandler}
					
				/>
				{(name.length!==0 && !isEdit)? <div style={{color:"red"}}>press Enter to continue</div>:null}
				<CopyToClipboard text={me} style={{ marginBottom: "2rem" }}>
					<Button variant="contained" color="primary" startIcon={<AssignmentIcon fontSize="large" />} disabled = {!isEdit}>
						Copy ID
					</Button>
				</CopyToClipboard>

				<TextField
					id="filled-basic"
					label="ID to call"
					variant="filled"
					value={idToCall}
					onChange={(e) => setIdToCall(e.target.value)}
					disabled={!isEdit}
				/>
				<div className="call-button">
					{callAccepted && !callEnded ? (
						<Button variant="contained" color="secondary" onClick={leaveCall}>
							End Call
						</Button>
					) : (
						<IconButton color="primary" aria-label="call" onClick={() => callUser(idToCall)} disabled = {!isEdit}>
							<PhoneIcon fontSize="large" />
						</IconButton>
					)}
				</div>
			</div>

		</div>
		</div>
		</>
	)
}

export default App
