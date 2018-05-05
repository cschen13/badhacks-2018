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
const VEC_DIFF_MAX = Math.sqrt(12);

const SidesContainer = styled('div')`
  height: 100vh;
  width: 100vw;
`;

const SideDiv = styled('div')`
  display: inline-block;
  width: ${props => props.totalScore ? 100*(1-props.score/props.totalScore) : 50}%;
  background-color: ${props => props.color};
  height: 100vh;
`;

export default class Game extends Component {
  constructor(props) {
    super(props);
    this.state = {
      leftGesture: 0,
      rightGesture: 0,
      leftScore: 0,
      rightScore: 0,
      leftTotal: 0,
      rightTotal: 0,
      numRounds: 0,
    };
  }

  componentWillReceiveProps() {
    this.getScores();
  }

  componentDidMount() {
    this.generateNewGesture();
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
    const { leftGesture, rightGesture, leftScore, rightScore } = this.state;

    return (
      <SidesContainer>
        <SideDiv score={leftScore} totalScore={leftScore+rightScore} color="red">
          <p>Left score: {leftScore}</p>
          <p>Gesture: {leftGestures[leftGesture].name}</p>
        </SideDiv>
        <SideDiv score={rightScore} totalScore={leftScore+rightScore} color="blue">
          <p>Right score: {rightScore}</p>
          <p>Gesture: {rightGestures[rightGesture].name}</p>
        </SideDiv>
      </SidesContainer>
    );
  }
}