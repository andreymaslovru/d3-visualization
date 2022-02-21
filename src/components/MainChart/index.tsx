import React, {useEffect, useMemo, useRef} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  Dimensions,
  Animated,
  TextInput,
} from 'react-native';
import Svg, {Defs, LinearGradient, Path, Stop} from 'react-native-svg';

import * as scale from 'd3-scale';
import * as shape from 'd3-shape';
import * as format from 'd3-format';
import * as axis from 'd3-axis';

import * as path from 'svg-path-properties';

const d3 = {
  scale,
  shape,
  format,
  axis,
};

import {scaleTime, scaleLinear} from 'd3-scale';

export type DataType = {
  x: Date;
  y: number;
};

const data: DataType[] = [
  {x: new Date(2022, 9, 1), y: 0},
  {x: new Date(2022, 9, 10), y: 10},
  {x: new Date(2022, 10, 11), y: 20},
  {x: new Date(2022, 10, 22), y: 230},
  {x: new Date(2022, 10, 25), y: 500},
  {x: new Date(2022, 11, 1), y: 550},
  {x: new Date(2022, 11, 12), y: 100},
  {x: new Date(2022, 12, 4), y: 910},
];

const height = 200;
const {width} = Dimensions.get('window');
const verticalPadding = 5;
const labelWidth = 100;

const scaleX = scaleTime()
  .domain([new Date(2022, 9, 1), new Date(2022, 12, 4)])
  .range([0, width]);

const scaleY = scaleLinear()
  .domain([data[0].y, data[data.length - 1].y])
  .range([height - verticalPadding, verticalPadding]);

const scaleLabel = scale
  .scaleQuantile()
  .domain([data[0].y, data[data.length - 1].y])
  .range(data.map(item => item.y));

const line = d3.shape
  .line() //@ts-ignore
  .x(d => scaleX(d.x)) //@ts-ignore
  .y(d => scaleY(d.y)) //@ts-ignore
  .curve(d3.shape.curveBasis)(data);

const properties = new path.svgPathProperties(line);
const lineLength = properties.getTotalLength();

interface MainChartProps {}

export const MainChart: React.FC<MainChartProps> = () => {
  const x = useMemo(() => new Animated.Value(0), []);

  const cursor = useRef(null);
  const label = useRef(null);

  const translateX = x.interpolate({
    inputRange: [0, lineLength],
    outputRange: [width - labelWidth, 0],
    extrapolate: 'clamp',
  });

  const moveCursor = (value: number) => {
    const xVal = properties.getPointAtLength(value).x;
    const yVal = properties.getPointAtLength(value).y;
    //@ts-ignore
    cursor.current?.setNativeProps({top: yVal - 10, left: xVal - 10});
    const labelVal = scaleLabel(scaleY.invert(yVal));
    //@ts-ignore
    label.current?.setNativeProps({text: `${labelVal}`});
  };

  useEffect(() => {
    x.addListener(({value}) => moveCursor(lineLength - value));
    moveCursor(0);
  }, [x]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.container}>
        <Svg {...{width, height}}>
          <Defs>
            <LinearGradient
              x1={'50%'}
              y1={'0%'}
              x2={'50%'}
              y2={'100%'}
              id={'gradient'}>
              <Stop stopColor={'#CDE3F8'} offset={'0%'} />
              <Stop stopColor={'#EEF6FD'} offset={'80%'} />
              <Stop stopColor={'#FEFFFF'} offset={'100%'} />
            </LinearGradient>
          </Defs>
          <Path
            d={line}
            fill={'transparent'}
            stroke={'#367be2'}
            strokeWidth={4}
          />
          <Path
            d={`${line} L ${width} ${height} L 0 ${height}`}
            fill={'url(#gradient)'}
          />
          <View ref={cursor} style={styles.cursor} />
        </Svg>
        <Animated.ScrollView
          style={StyleSheet.absoluteFill}
          contentContainerStyle={{width: lineLength * 2}}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          scrollEventThrottle={16}
          onScroll={Animated.event(
            [
              {
                nativeEvent: {
                  contentOffset: {x},
                },
              },
            ],
            {useNativeDriver: true},
          )}
          horizontal
        />
        <Animated.View style={[styles.label, {transform: [{translateX}]}]}>
          <TextInput ref={label} />
        </Animated.View>
      </View>
    </SafeAreaView>
  );
};

export const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    marginTop: 60,
    height,
    width,
  },
  cursor: {
    width: 16,
    height: 16,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#367be2',
    backgroundColor: 'white',
  },
  label: {
    position: 'absolute',
    backgroundColor: '#81b2fc',
    width: labelWidth,
    top: -45,
    left: 0,
    borderRadius: 10,
    padding: 10,
  },
});
