// new RainVue({data:{...}})

class RainVue {
    constructor(options) {
        // 获取数据,先获取options
        this.$options = options;

        // 数据响应化
        this.$data = options.data;
        this.observe(this.$data);

        new Compile(options.el, this);

        // computed执行
        if (options.computed) {
            this.initComouted(options.computed)
        }

        // created执行 生命周期
        if (options.created) {
            options.created.call(this);
        }
    }

    // 初始化计算属性
    initComouted(computed) {
        let watchers = this._watcherComputed = Object.create(null)
        // 遍历该对象
        Object.keys(computed).forEach(key => {
            const userDef = computed[key]
            watchers[key] = new Watcher(this, userDef, ()=>{}, {lazy:true})

            // 把computed属性直接挂载到Vue的实例上
            Object.defineProperty(this, key, { 
                get: this.createComputedGetter(key)
                
            })
        });
    }

    createComputedGetter(key) {
        let watcher = this._watcherComputed[key]
        return function () {
            if (watcher) {
                if (watcher.dirty) {
                    watcher.evalValue()
                }
                if (Dep.target) {
                    watcher.depend()
                }
                return watcher.value
            }
        }
    }

    // 观察数据
    observe(value) {
        if (!value || typeof value !== "object") return;

        // 遍历该对象
        Object.keys(value).forEach(key => {
            this.defineReactive(value, key, value[key]);
            // 代理data中的属性到vue实例上
            this.proxyData(key);
        });
    }

    // 数据响应化
    defineReactive(obj, key, val) {
        this.observe(val); // 递归解决数据嵌套

        const dep = new Dep(); // 依赖收集器

        Object.defineProperty(obj, key, {
            get() {
                // Dep.target 就是watcher实例
                Dep.target && dep.addDep(Dep.target);
                return val;
            },
            set(newVal) {
                if (newVal === val) return;
                val = newVal;

                console.log(`${key}属性更新了：${val}`);
                dep.notify(); // 通知依赖更新
            }
        });
    }

    proxyData(key) {
        Object.defineProperty(this, key, {
            get() {
                return this.$data[key]
            },
            set(newVal) {
                this.$data[key] = newVal;
            }
        })
    }

}

// Dep：用来管理Watcher
class Dep {
    constructor() {
        // 这里存放若干依赖（watcher）
        this.deps = [];
    }

    addDep(dep) {
        this.deps.push(dep);
    }

    notify() {
        this.deps.forEach(dep => dep.update());
    }
}

// Watcher
let uid = 0
class Watcher {
    constructor(vm, keyOrFn, cb=()=>{}, opts={}) {
        this.vm = vm;
        this.keyOrFn = keyOrFn
        this.cb = cb;
        //
        this.id = uid++
        this.deps = []
        this.depsId = new Set()
        this.lazy = opts.lazy
        this.dirty = this.lazy
        //
        if (typeof keyOrFn==='function'){
            this.getter = keyOrFn
        }else{
            this.key = keyOrFn;
        }

        // 将当前watcher实例指定到Dep静态属性target
        Dep.target = this;
        this.vm[this.key]; // 触发getter，添加依赖
        Dep.target = null;
    }

    update() {
        console.log("属性更新了");
        this.cb.call(this.vm, this.vm[this.key]);
    }
}

