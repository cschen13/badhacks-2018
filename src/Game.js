import React, { Component } from 'react';
import styled from 'react-emotion';
import { leftGestures, rightGestures } from './data/gestures';
import leftClassic from './data/images/leftGestures/classic_force_choke.jpg';
import leftFingerPoint from './data/images/leftGestures/finger_point.jpg';
import leftOpen from './data/images/leftGestures/open_hand.jpg';
import leftSpock from './data/images/leftGestures/spock.jpg';
import leftUnderhand from './data/images/leftGestures/underhand_choke.jpg';
import rightSpock from './data/images/rightGestures/spock.jpg';
import rightUnderhand from './data/images/rightGestures/underhand_choke.jpg';
import rightOk from './data/images/rightGestures/ok_fingers.jpg';
import rightOpen from './data/images/rightGestures/open_hand.jpg';
import rightClassic from './data/images/rightGestures/classic_force_choke.jpg';
import forceVideo from './data/force.mp4';
import redVideo from './data/red_wins.mp4';
import blueVideo from './data/blue_wins.mp4';

const calcEuclideanDistance = (v, u) => {
  let sum = 0;
  for (let i = 0; i < 3; i++) {
    sum += (v[i]-u[i]) * (v[i]-u[i]);
  }

  return Math.sqrt(sum);
}

const randInt = (n) => Math.floor(Math.random() * n);

const ROUND_LENGTH_MS = 7000;
const MAX_ROUNDS = 1;
const VEC_DIFF_MAX = Math.sqrt(12);

const leftImages = [leftClassic, leftOpen, leftFingerPoint, leftUnderhand, leftSpock];
const rightImages = [rightClassic, rightOpen, rightUnderhand, rightOk, rightSpock];

const FONT_STACK = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";';

const ButtonContainer = styled('div')`
  position: absolute;
  z-index: 99;
  left: 50%;
  transform: translateX(-50%);
  top: 300px;
`;

const SidesContainer = styled('div')`
  height: 100vh;
  width: 100vw;
  position: relative;
  font-family: ${FONT_STACK};
  z-index: 0;
`;

const SideDiv = styled('div')`
  display: inline-block;
  width: ${props => props.width}%;
  background-color: ${props => props.color};
  height: 100vh;
  position: relative;
  opacity: 0.75;
`;

const TimerDiv = styled('div')`
  position: absolute;
  left: 0;
  transform: translateX(-50%);
  top: 500px;
  font-size: 2rem;
  color: #fefefe;
`;

const ScoreDiv = styled('div')`
  position: absolute;
  ${props => props.side}: 20px;
  top: 300px;
  font-size: 3rem;
  color: #fefefe;
`;

const RoundDiv = styled('div')`
  position: absolute;
  left: 0;
  transform: translateX(-50%);
  top: 100px;
  font-size: 2rem;
  color: #fefefe;
`;

const Img = styled('img')`
  position: absolute;
  ${props => props.side}: 25%;
  top: 200px;
  transform: translateX(${props => props.side === 'left' ? -50 : 50}%);
  z-index: 99;
`;

const Video = styled('video')`
  left: 0;
  position: absolute;
  height: 800px;
  z-index: -1;
`;

const GameOverContainer = styled('div')`
  background-color: ${props => props.winner};
`;

const GameOverFilter = styled('div')`
  background-color: ${props => props.winner};
  opacity: 0.5;
  position: absolute;
  left: 0;
  height: 100vh;
  width: 100vw;
  z-index: 0;
`;

const GameOverTextContainer = styled('div')`
  padding-top: 100px;
  position: relative;
  z-index: 99;
`;

const GameOverText = styled('p')`
  text-align: center;
  font-size: 3rem;
  color: #fefefe;
  font-family: ${FONT_STACK};
`;

const INITIAL_STATE = {
  leftGesture: 0,
  rightGesture: 0,
  leftScore: 0,
  rightScore: 0,
  leftTotal: 0,
  rightTotal: 0,
  currentRoundNum: 0,
  currentRoundStartMS: 0,
}

export default class Game extends Component {
  constructor(props) {
    super(props);
    this.state = { ...INITIAL_STATE };
  }

  componentWillReceiveProps() {
    const { currentRoundNum, currentRoundStartMS } = this.state;
    const timeSinceRoundStart = Date.now() - currentRoundStartMS;

    if (currentRoundNum && timeSinceRoundStart >= ROUND_LENGTH_MS) {
      this.startNewRound();
    }

    this.getScores();
  }

  restartGame = () => {
    this.setState({ ...INITIAL_STATE });
  }

  startNewRound = () => {
    const { currentRoundNum, leftScore, rightScore, leftTotal, rightTotal } = this.state;

    let newLeftTotal = leftTotal;
    let newRightTotal = rightTotal;

    if (currentRoundNum > 0) {
      newLeftTotal += 10000*(1-leftScore/(leftScore+rightScore)).toFixed(2);
      newRightTotal += 10000*(1-rightScore/(leftScore+rightScore)).toFixed(2);
    }

    this.generateNewGesture();
    this.setState({
      currentRoundNum: currentRoundNum + 1,
      currentRoundStartMS: Date.now(),
      leftTotal: newLeftTotal,
      rightTotal: newRightTotal,
    });
  }

  getScores() {
    const { leftHand, rightHand } = this.props;
    const { leftGesture, rightGesture } = this.state;

    if (!leftHand.frame || !rightHand.frame) {
      return;
    }

    const leftFingers = leftHand.frame.fingers;
    const rightFingers = rightHand.frame.fingers;

    let leftSum = 0;
    leftFingers.forEach((finger) => {
      finger.bones.forEach((bone) => {
        leftSum += calcEuclideanDistance(
          bone.direction(),
          leftGestures[leftGesture][finger.type].bones[bone.type].direction
        );
      });
    });

    let rightSum = 0;
    rightFingers.forEach((finger) => {
      finger.bones.forEach((bone) => {
        rightSum += calcEuclideanDistance(
          bone.direction(),
          rightGestures[rightGesture][finger.type].bones[bone.type].direction
        );
      });
    });

    this.setState({
      leftScore: (leftSum/20)/VEC_DIFF_MAX,
      rightScore: (rightSum/20)/VEC_DIFF_MAX,
    });
  }

  saveScores() {
    const { leftScore, rightScore, leftTotal, rightTotal } = this.state;
    this.setState({
      leftTotal: leftTotal + leftScore,
      rightTotal: rightTotal + rightScore,
    })
  }

  generateNewGesture() {
    const { leftGesture, rightGesture } = this.state;
    let newLeftGesture = randInt(leftGestures.length);
    while (newLeftGesture === leftGesture) {
      newLeftGesture = randInt(leftGestures.length);
    }

    let newRightGesture = randInt(rightGestures.length);
    while (newRightGesture === rightGesture) {
      newRightGesture = randInt(rightGestures.length);
    }

    this.setState({
      leftGesture: newLeftGesture,
      rightGesture: newRightGesture,
    });
  }

  render() {
    const {
      leftGesture,
      rightGesture,
      leftScore,
      rightScore,
      leftTotal,
      rightTotal,
      currentRoundNum,
      currentRoundStartMS
    } = this.state;

    if (currentRoundNum === 0) {
      return (
        <div>
          <ButtonContainer>
            <button onClick={this.startNewRound}>Start</button>
          </ButtonContainer>
        </div>
      );
    }

    if (currentRoundNum > MAX_ROUNDS) {
      return (
        <GameOverContainer>
          <GameOverFilter winner={leftTotal > rightTotal ? '#E7040F' : '#00449E'} />
          { leftTotal > rightTotal &&
            <div>
              <Video autoPlay loop>
                <source src={redVideo} type='video/mp4' />
              </Video>
              <GameOverTextContainer>
                <GameOverText>UNLIMITED POWER!!!!!!</GameOverText>
                <GameOverText>The Sith win: {leftTotal} vs. {rightTotal}</GameOverText>
              </GameOverTextContainer>
            </div>
          }
          { leftTotal < rightTotal &&
            <div>
              <Video autoPlay loop>
                <source src={blueVideo} type='video/mp4' />
              </Video>
              <GameOverTextContainer>
                <GameOverText>It's over, Anakin! I have the higher ground!</GameOverText>
                <GameOverText>The Jedi win: {rightTotal} vs. {leftTotal}</GameOverText>
              </GameOverTextContainer>
            </div>
          }
          { leftTotal === rightTotal &&
            <GameOverTextContainer>
              <GameOverText>So this is what you call a diplomatic mission?</GameOverText>
              <GameOverText>It's a tie! {rightTotal} vs. {leftTotal}</GameOverText>
            </GameOverTextContainer>
          }
          <ButtonContainer>
            <button onClick={this.restartGame}>Play again</button>
          </ButtonContainer>
        </GameOverContainer>
      )
    }

    const timeSinceRoundStart = Date.now() - currentRoundStartMS;

    const leftWidth = (leftScore+rightScore) ? 100*(1-leftScore/(leftScore+rightScore)) : 50;
    const rightWidth = 100-leftWidth;

    return (
      <SidesContainer>
        <Img src={leftImages[leftGesture]} height="200px" side="left"/>
        <SideDiv width={leftWidth} color="#E7040F">
          <ScoreDiv side="right">{leftWidth.toFixed(2) * 100}</ScoreDiv>
        </SideDiv>
        <Img src={rightImages[rightGesture]} height="200px" side="right" />
        <SideDiv width={rightWidth} color="#00449E">
          <ScoreDiv side="left">{rightWidth.toFixed(2) * 100}</ScoreDiv>
          <TimerDiv>{ (ROUND_LENGTH_MS - timeSinceRoundStart)/1000 }s</TimerDiv>
          <RoundDiv>Round { currentRoundNum }/{ MAX_ROUNDS }</RoundDiv>
        </SideDiv>
        <Video autoPlay loop>
          <source src={forceVideo} type='video/mp4' />
        </Video>
      </SidesContainer>
    );
  }
}