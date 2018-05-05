import React, { Component } from 'react';
import styled from 'react-emotion';
import { leftGestures, rightGestures } from './data/gestures';

const calcEuclideanDistance = (v, u) => {
  let sum = 0;
  for (let i = 0; i < 3; i++) {
    sum += (v[i]-u[i]) * (v[i]-u[i]);
  }

  return Math.sqrt(sum);
}

const randInt = (n) => Math.floor(Math.random() * n);

const ROUND_LENGTH_MS = 5000;
const MAX_ROUNDS = 5;
const VEC_DIFF_MAX = Math.sqrt(12);

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
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
`;

const SideDiv = styled('div')`
  display: inline-block;
  width: ${props => props.width}%;
  background-color: ${props => props.color};
  height: 100vh;
  position: relative;
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
    const { currentRoundNum, currentRoundStartMS, leftScore, rightScore, leftTotal, rightTotal } = this.state;

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
    const { leftHand, rightHand } = this.props;
    const { leftGesture, rightGesture, leftScore, rightScore, leftTotal, rightTotal, currentRoundNum, currentRoundStartMS } = this.state;

    if (currentRoundNum === 0) {
      return (
        <ButtonContainer>
          <button onClick={this.startNewRound}>Start</button>
        </ButtonContainer>
      );
    }

    if (currentRoundNum > MAX_ROUNDS) {
      return (
        <ButtonContainer>
          <p>It's Over!!!</p>
          <p>Left score: {leftTotal}</p>
          <p>Right score: {rightTotal}</p>
          <button onClick={this.restartGame}>Play again</button>
        </ButtonContainer>
      )
    }

    const timeSinceRoundStart = Date.now() - currentRoundStartMS;

    const leftWidth = (leftScore+rightScore) ? 100*(1-leftScore/(leftScore+rightScore)) : 50;
    const rightWidth = 100-leftWidth;

    return (
      <SidesContainer>
        <SideDiv width={leftWidth} color="#00449E">
          <ScoreDiv side="right">{leftWidth.toFixed(2) * 100}</ScoreDiv>
        </SideDiv>
        <SideDiv width={rightWidth} color="#E7040F">
          <ScoreDiv side="left">{rightWidth.toFixed(2) * 100}</ScoreDiv>
          <TimerDiv>{ (ROUND_LENGTH_MS - timeSinceRoundStart)/1000 }s</TimerDiv>
          <RoundDiv>Round { currentRoundNum }/{ MAX_ROUNDS }</RoundDiv>
        </SideDiv>
      </SidesContainer>
    );
  }
}