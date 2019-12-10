<template>
  <el-container>
    <el-header class="home-header" style="height: 5vh;">
    </el-header>
    <el-main class="home-main">
      <div class="first-item">
        <div class="top">
          <el-autocomplete class="home-input" :fetch-suggestions="querySearch" prefix-icon="el-icon-search" placeholder="请输入内容" clearable v-model="queryString"></el-autocomplete>
          <button class="btn-create-task" @click="openNewDialog">新建任务</button>
        </div>
        <div class="center">
          <el-table :data="tableData" :row-key="getRowKey">
            <el-table-column prop="taskTitle" label="标题" align="center" ></el-table-column>
            <el-table-column prop="startTime" label="开始时间" align="center" sortable :filters="startTimeFilters" :filter-method="handleStartTimeFilter"></el-table-column>
            <el-table-column prop="endTime" label="结束时间" align="center" sortable></el-table-column>
            <el-table-column label="任务星级" align="center" sortable :sort-method="handleLevelSort">
              <template slot-scope="props">
                <el-rate v-model="props.row.taskLevel" disabled></el-rate>
              </template>
            </el-table-column>
            <el-table-column label="完成情况" align="center" sortable :sort-method="handleCompleteStatusSort">
              <template slot-scope="props">
                <el-progress :percentage="props.row.completeStatus" type="dashboard" :width="progressWidth" color="#409eff"></el-progress>
              </template>
            </el-table-column>
            <el-table-column label="操作" align="center">
              <template slot-scope="props">
                <el-button size="small" icon="el-icon-edit" circle @click="openEditDialog(props.row);"></el-button>
                <el-button size="small" icon="el-icon-delete" circle @click="openDelete(props.row)"></el-button>
              </template>
            </el-table-column>
            <el-table-column type="expand">
              <template slot-scope="props" lazy class="demo-table-expand">
                <el-form style="margin-left: 4vw;" label-position="left" inline v-for="(item, index) in props.row.taskContentBeanList"
                 :key="item.contentId" @click.native="contentStatusChange(item, props.row)">
                    <el-form-item style="margin-top: 0.5rem; margin-bottom: 0.5rem">
                      <i :class="['iconfont', 'icon-circle',{'icon-circle-right' : item.isFinished == 1}]"></i>
                    </el-form-item>
                    <el-form-item label="任务内容" style="margin-top: 0.5rem; margin-bottom: 0.5rem">
                      <span>{{item.taskContent}}</span>
                    </el-form-item>
                </el-form>
              </template>
            </el-table-column>
          </el-table>

          <el-dialog :title="dialogTitle[dialogStatus]" :visible.sync="dialogFormVisible">
            <el-form :model="task" ref="task" label-width="5rem">
              <el-form-item label="任务标题" prop="taskTitle">
                <el-input v-model="task.taskTitle"></el-input>
              </el-form-item>
              <el-row>
                <el-col :span="8">
                  <el-form-item label="开始时间" prop="startTime">
                    <el-date-picker type="datetime" value-format="yyyy-MM-dd HH:mm:ss" placeholder="选择开始时间" v-model="task.startTime" style="width:100%;"></el-date-picker>
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="结束时间" prop="endTime">
                    <el-date-picker type="datetime" value-format="yyyy-MM-dd HH:mm:ss" placeholder="选择结束时间" v-model="task.endTime" style="width:100%;"></el-date-picker>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-form-item label="任务星级" prop="taskLevel">
                <el-rate v-model="task.taskLevel" style="display:inline-flex; width:100%"></el-rate>
              </el-form-item>
              <el-form-item v-for="(taskContentBean, index) in task.taskContentBeanList"
                :label="'任务内容' + index"
                :key="taskContentBean.key"
                :prop="'taskContentBeanList.' + index + '.taskContent'">
                <el-row style="display:flex;">
                  <el-input v-model="taskContentBean.taskContent" style="width:25rem"></el-input>
                  <el-button @click.prevent="removeTaskContent(taskContentBean)" type="danger" style="margin-left:1rem">删除</el-button>
                </el-row>
              </el-form-item>
              <el-row>
                <el-button @click="addTaskContent">新增内容</el-button>
                <el-button type="primary" @click="updateInfo">{{dialogButton[dialogStatus]}}</el-button>
              </el-row>
            </el-form>
          </el-dialog>
        </div>
      </div>
    </el-main>
  </el-container>
</template>

<script>
import { watch } from 'fs'
export default {
  name: 'HelloWorld',
  data() {
    return {
      tableData:[],       //table中的数据，在加载时获取
      tableData1: [],         //拷贝一份tableData，用户搜索框过滤= =
      dialogFormVisible: false,       //设置dialog是否可见
      task: {             //dialog中的对应的task
        id:'',
        taskTitle: '',
        startTime: '',
        endTime: '',
        taskLevel: 0,
        taskContentBeanList: [{
          contentId: '',
          taskId: '',
          taskContent: ''
        }]
      },
      dialogTitle: {          //dialog中的标题
        addTask: '新建任务',
        editTask: '编辑任务'
      },
      dialogButton: {           //dialog中的按钮
        addTask: '创建任务',
        editTask: '保存任务'
      },
      dialogStatus: '',         //dialog的状态， 有addTask 和 editTask 即创建任务和编辑任务
      queryString: '',      //搜索框输入的字符串
      startTimeFilters: [],     //开始时间的数组
      progressWidth: 50,      //进度条的宽度
      titles: []      //存储标题的数组
    }
  },
  props: {
    msg: String
  },
  mounted() {
    this.getInfo()
  },
  methods:{
    //获取所有任务
    getInfo() {
        this.$axios.get('/apis/task/all')
          .then(response => {
            this.tableData = response.data.data
            this.tableData1 = response.data.data
            let array = []  //新建数组方便去重，存储开始时间
            response.data.data.forEach((item) => {
              array.push(
                item.startTime.split(" ")[0]  //提取开始时间的年月日，去除时间
              )
              this.titles.push(item.taskTitle)
            })
            Array.from(new Set(array)).forEach(item => {
              this.startTimeFilters.push({
                'text': item,
                'value': item
              })
            })
          })
          .catch(error => {
            console.log(error)
          })
    },
    updateInfo() {
      if (this.dialogStatus === 'editTask') {
        this.$axios.put('/apis/task', this.task).then(response => {
          if (response.data.status === 200) {
            this.dialogFormVisible = false;
            this.$message({
              type: 'success',
              message: '保存成功！'
            })
          }
        });
      } else {
        this.$axios.post('/apis/task', this.task).then(response => {
          if (response.data.status === 200) {
            this.dialogFormVisible = false
            this.$message({
              type: 'success',
              message: '创建成功！'
            })
            this.task.id = response.data.data
            this.tableData.push(this.task)
          }
        })
      }
    },
    //删除任务
    deleteInfo(task) {
      this.$axios.delete('/apis/task/' + task.id).then(response => {
        if (response.data.status == 200) {
          console.log(response.data)
        }
      });
      let index = this.tableData.indexOf(task)
      if(index != -1) {
        this.tableData.splice(index, 1)
        console.log(index)
      }
    },
    //弹出删除任务对话框
    openDelete(task) {
      this.$confirm('确认删除此任务吗？','提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
          this.$message({
            type: 'success',
            message: '删除成功！'
          }),
          this.deleteInfo(task)
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        })
      }
      )
    },
    //绑定行id
    getRowKey(row) {
      return row.id
    },
    //显示dialog（编辑），将行数据赋给task
    openEditDialog(row) {
      this.dialogFormVisible = true
      this.task = row
      this.dialogStatus = 'editTask'
    },
    openNewDialog() {
      this.resetForm('task')
      this.dialogFormVisible = true
      this.dialogStatus = 'addTask'
    },
    //删除一项任务内容
    removeTaskContent(taskContent) {
      let index = this.task.taskContentBeanList.indexOf(taskContent)
      if (index != -1) {
        this.task.taskContentBeanList.splice(index, 1)
      }
      if (this.dialogStatus === 'editTask') {
        this.$axios.delete('apis/task/content/' + taskContent.contentId).then(response => {
          console.log(response.data)
        })
      }
    },
    //增加任务内容
    addTaskContent() {
      this.task.taskContentBeanList.push({
        taskId: this.task.id,
        taskContent:'',
        key: Date.now()
      });
      if (this.dialogStatus === 'editTask') {
        this.$axios.post('apis/task/content', {
          taskId: this.task.id,
          taskContent:''
        }).then(response => {
          let index = this.task.taskContentBeanList.length
          this.task.taskContentBeanList[index-1].contentId = response.data.data
        })
      }
    },
    resetForm(formName) {
      if (this.$refs[formName] !== undefined) {
        this.$nextTick(() => {
          //清空task数据
          this.task = {
            id:'',
            taskTitle: '',
            startTime: '',
            endTime: '',
            taskLevel: 0,
            taskContentBeanList: [{
              taskContent: ''
            }]
          }
          this.$refs[formName].resetFields();
        })
      }
    },
    //更改任务状态，参数item为任务内容，row为一行数据
    contentStatusChange(item, row) {
      this.$set(item, 'isFinished', !item.isFinished)
      this.$axios.put('apis/task/content-status/' + item.contentId).then(response => {
        if (response.data.status == 200) {
          row.completeStatus = response.data.data
        }
      })
    },
    querySearch(queryString, cb) {
      if (queryString !== '') {
        this.$axios.get('apis/task/title', {
          params:{
            taskTitle: queryString
          }
        }).then(response => {
          if (response.data.status === 200) {
            let titles = []
            response.data.data.forEach(item => {
              titles.push({"value": item.taskTitle})
            })
            cb(titles)
          }
        })
      }
    },
    handleStartTimeFilter(value, row, column) {
      return row.startTime.split(" ")[0] === value
    },
    handleLevelSort(task2, task1) {
      return task2.taskLevel > task1.taskLevel ? 1 : -1
    },
    handleCompleteStatusSort(task2, task1) {
      return task2.completeStatus > task1.completeStatus ? 1 : -1
    }
  },
  watch: {
    queryString: function(val) {
      if (val !== '') {
        this.tableData = this.tableData.filter(function(data){
          return Object.keys(data).some(function(key) {
            return String(data["taskTitle"]).toLowerCase().indexOf(val) > -1
          })
        })
      } else {
        this.tableData = this.tableData1
      }
    }
  }
}
</script>

<style lang="scss">
  @import '../assets/element-ui.scss';
</style>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss" scoped>
  .first-item {
    width: 65vw;
    background: #fff;
    margin: 0 auto;
    border-radius: 0.2rem;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
    padding-top: 1rem;
    padding-bottom: 3rem;
  }
  .top {
    padding: 0 1.75rem 1rem;
    border-bottom: 1px solid #E0E0E0;
      .btn-create-task {
        float: right;
        background: #0099FF;
        color: #fff;
        width: 8rem;
        border:0;
        border-radius: 0.25rem;
        outline: none;
        height: 2.5rem;
        transition-duration: 0.2s;
        &:hover {
            background: #00CCFF;
            color: #fff;
        }
        &:active {
            background: #0066CC;
            color: #fff;
            transition-duration: 0.2s;
        }
      }
  }
  .center {
    margin-top: 0.3rem;
    margin-left: 2rem;
    margin-right: 2rem;
    text-align: center;

  }
</style>
