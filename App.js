import React, { Component } from 'react';
import {
  StyleSheet,
  View
} from 'react-native';
import { Echarts, echarts } from 'react-native-secharts';
import apisauce from 'apisauce';
import pako from 'pako';

export default class App extends Component<Props> {
  constructor(props) {
    super(props);
    this.state = {
      categoryData: [],
      values: [],
      display: true,
    };
    this.option = null;
    this.categoryData = [];
    this.values = [];
    this.ma5 = [];
    this.ma10 = [];
  }

  componentDidMount() {
    this.createOption();
    const api = apisauce.create({
      baseURL: 'https://api.huobi.pro/market'
    });
    api
      .get('/history/kline?period=1min&size=200&symbol=btcusdt')
      .then((response) => {
        if (response.status === 200 && response.data.status === 'ok') {
          const list = response.data.data.reverse();
          list.map((item) => {
            const d = new Date(item.id * 1000);
            this.categoryData.push(`${d.getHours()}:${(d.getMinutes() < 10 ? '0' : '') + d.getMinutes()}`);
            this.values.push([item.open, item.close, item.low, item.high]);
          });
          this.initMA(5, this.ma5);
          this.initMA(10, this.ma10);
          this.addOption();
          this.createWebSocket();
        } else {
          // console.log(JSON.stringify(response));
        }
      });

  }

  addOption = (ma5 = [], ma10 = []) => {
    const newOptions = {
      xAxis: {
        data: this.categoryData
      },
      series: [
        {
          data: this.values
        },
        {
          data: this.ma5
        },
        {
          data: this.ma10
        }
      ]
    };
    this.kChart.setOption(newOptions);
  }

  createWebSocket = () => {
    const ws = new WebSocket('wss://api.huobi.br.com/ws');
    ws.onopen = () => {
      this.sendPing(ws);
      ws.send(JSON.stringify({ sub: 'market.btcusdt.kline.1min', id: 'id2' }));
    };
    ws.onmessage = (event) => {
      const data = event.data;
      const result = JSON.parse(pako.inflate(new Uint8Array(data), { to: 'string' }));
      // console.log(JSON.stringify(result));
      if (result.ping) {
        this.sendPong(ws, result.ping);
      } else if (result.tick) {
        const newDate = new Date(result.tick.id * 1000);
        const newCategory = `${newDate.getHours()}:${(newDate.getMinutes() < 10 ? '0' : '') + newDate.getMinutes()}`;
        if (this.categoryData.indexOf(newCategory) === -1) {
          this.categoryData.push(newCategory);
          this.values.push([result.tick.open, result.tick.close, result.tick.low, result.tick.high]);
          this.categoryData.splice(0,1);
          this.values.splice(0,1);

          this.ma5.push(this.lastMA(5));
          this.ma10.push(this.lastMA(10));
        } else {
          this.values[this.values.length - 1] = [result.tick.open, result.tick.close, result.tick.low, result.tick.high];
        }
        this.addOption();
      }
    };
  }

  sendPing = (ws) => {
    ws.send(JSON.stringify({ ping: Date.now() }));
  }

  sendPong = (ws, params) => {
    ws.send(JSON.stringify({ pong: params }));
  }

  createOption = () => {
    this.option = {
      tooltip: {
        trigger: 'item',
        axisPointer: {
          type: 'shadow'
        },
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderColor: '#cee5ff',
        borderWidth: 1,
        padding: [5, 10],
        textStyle: {
          color: '#444'
        },
        formatter: (params) => {
          return params.name
        }
      },
      grid: {
        left: '5%',
        top: '5%',
        width: '100%',
        containLabel: true
      },
      xAxis: [{
        type: 'category',
        data: this.state.categoryData,
        boundaryGap: false,
        min: (value) => {
          return value.min;
        },
        min: (value) => {
          return value.max;
        },
        axisLine: {
          show: false,
          onZero: false
        },
        axisLabel: {
          show: true,
        },
        axisTick: {
          inside: true,
          length: 4
        },
        splitLine: {
          show: false
        }
      }],
      yAxis: {
        scale: true,
        boundaryGap: ['5%', '5%'],
        splitNumber: 3,
        splitLine: {
          show: true
        },
        splitArea: {
          show: false //部分交叉块是否展示不同的颜色
        },
        axisTick: {
          length: 0
        },
        axisLine: {
          show: false
        },
        axisLabel: {
          showMinLabel: false
          // fontSize: 5
        },
        offset: -25,
        position: 'right',
        zlevel: 0 //值为1的时候可以使得y轴的坐标显示在bar上面，而不是被bar覆盖
      },
      dataZoom: [{
        type: 'inside',
        start: 80,
        end: 100,
        minValueSpan: 4
        // maxValueSpan: 100
      }],
      series: [
      {
        name: 'BTC/USDT',
        type: 'candlestick',
        barWidth: '50%',
        data: this.state.values,
        markPoint: {
          symbolSize: 8,
          label: {
            normal: {
                color: '#000000FF',
                fontSize: 8,
                offset: [15, 6],
                formatter: (params) =>{
                  return params.value;
                }
            }
          },
          itemStyle:{
              normal: {color: '#FFFFFF00'}
          },  
          data: [
              {type: 'max', name: '最大值', valueDim: 'highest'},
              {type: 'min', name: '最小值', valueDim: 'lowest'}
          ]
        },
        animation: false,
        itemStyle: {
          normal: {
            color: '#006400',
            color0: '#ec0000',
            borderColor: '#006400',
            borderColor0: '#ec0000'
          }
        }
      },
      {
        name: 'MA5',
        showSymbol: false,
        type: 'line',
        data: [],
        smooth: false,
        lineStyle: {
          normal: {
            opacity: 0.5
          }
        }
      },
      {
        name: 'MA10',
        showSymbol: false,
        type: 'line',
        data: [],
        smooth: false,
        lineStyle: {
          normal: {
            opacity: 0.5
          }
        }
      }
    ]}
    this.setState({ display: true });
  }

  initMA = (dayCount, target) => {
    const len = this.values.length;
    let start = 0 - dayCount;
    let sum = 0;
    for(let index = 0 ; index < len ; index++){
      if(index < dayCount){
        target.push('-');
      }else{
        target.push(sum*1.0 / dayCount);
        sum -= this.values[start][1];  
      }
      sum += this.values[index][1];
      start += 1;
    }
    // console.log(dayCount+': '+ target);
  }

  lastMA = (dayCount) =>{
    const len = this.values.length - 1;
    let result = 0;
    for(let i = 1; i <= dayCount ; i++){
      result += this.values[len - i][1];
    }
    return result*1.0 / dayCount;
  }

  render() {
    if (this.state.display) {
      return (
        <View style={styles.container}>
          <Echarts ref={(ref) => this.kChart = ref} option={this.option} height={400} />
        </View>
      );
    }
    return null;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
