
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        if (value === null) {
            node.style.removeProperty(key);
        }
        else {
            node.style.setProperty(key, value, important ? 'important' : '');
        }
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }
    class HtmlTag {
        constructor(is_svg = false) {
            this.is_svg = false;
            this.is_svg = is_svg;
            this.e = this.n = null;
        }
        c(html) {
            this.h(html);
        }
        m(html, target, anchor = null) {
            if (!this.e) {
                if (this.is_svg)
                    this.e = svg_element(target.nodeName);
                else
                    this.e = element(target.nodeName);
                this.t = target;
                this.c(html);
            }
            this.i(anchor);
        }
        h(html) {
            this.e.innerHTML = html;
            this.n = Array.from(this.e.childNodes);
        }
        i(anchor) {
            for (let i = 0; i < this.n.length; i += 1) {
                insert(this.t, this.n[i], anchor);
            }
        }
        p(html) {
            this.d();
            this.h(html);
            this.i(this.a);
        }
        d() {
            this.n.forEach(detach);
        }
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
        else if (callback) {
            callback();
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.55.1' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    function construct_svelte_component_dev(component, props) {
        const error_message = 'this={...} of <svelte:component> should specify a Svelte component.';
        try {
            const instance = new component(props);
            if (!instance.$$ || !instance.$set || !instance.$on || !instance.$destroy) {
                throw new Error(error_message);
            }
            return instance;
        }
        catch (err) {
            const { message } = err;
            if (typeof message === 'string' && message.indexOf('is not a constructor') !== -1) {
                throw new Error(error_message);
            }
            else {
                throw err;
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/State.svelte generated by Svelte v3.55.1 */

    const file$5 = "src/components/State.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (19:14) {#if fac.names_prev.length}
    function create_if_block$3(ctx) {
    	let li;
    	let b;
    	let t1;
    	let t2_value = /*fac*/ ctx[4].names_prev.join(" • ") + "";
    	let t2;

    	const block = {
    		c: function create() {
    			li = element("li");
    			b = element("b");
    			b.textContent = "Has also appeared as:";
    			t1 = space();
    			t2 = text(t2_value);
    			add_location(b, file$5, 19, 20, 679);
    			add_location(li, file$5, 19, 16, 675);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, b);
    			append_dev(li, t1);
    			append_dev(li, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && t2_value !== (t2_value = /*fac*/ ctx[4].names_prev.join(" • ") + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(19:14) {#if fac.names_prev.length}",
    		ctx
    	});

    	return block;
    }

    // (12:8) {#each county.facilities as fac}
    function create_each_block_1$1(ctx) {
    	let li3;
    	let a;
    	let t0_value = /*fac*/ ctx[4].name + "";
    	let t0;
    	let a_href_value;
    	let t1;
    	let ul;
    	let li0;
    	let b0;
    	let t3;
    	let t4_value = /*fac*/ ctx[4].city + "";
    	let t4;
    	let t5;
    	let li1;
    	let b1;
    	let t7;
    	let t8_value = /*fac*/ ctx[4].address + "";
    	let t8;
    	let t9;
    	let li2;
    	let b2;
    	let t11;
    	let t12_value = /*fac*/ ctx[4].EPAFacilityID + "";
    	let t12;
    	let t13;
    	let if_block = /*fac*/ ctx[4].names_prev.length && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			li3 = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			ul = element("ul");
    			li0 = element("li");
    			b0 = element("b");
    			b0.textContent = "City:";
    			t3 = space();
    			t4 = text(t4_value);
    			t5 = space();
    			li1 = element("li");
    			b1 = element("b");
    			b1.textContent = "Address:";
    			t7 = space();
    			t8 = text(t8_value);
    			t9 = space();
    			li2 = element("li");
    			b2 = element("b");
    			b2.textContent = "EPA Facility ID:";
    			t11 = space();
    			t12 = text(t12_value);
    			t13 = space();
    			if (if_block) if_block.c();
    			attr_dev(a, "href", a_href_value = "#/facility:" + /*fac*/ ctx[4].EPAFacilityID);
    			add_location(a, file$5, 13, 12, 376);
    			add_location(b0, file$5, 15, 18, 468);
    			add_location(li0, file$5, 15, 14, 464);
    			add_location(b1, file$5, 16, 18, 515);
    			add_location(li1, file$5, 16, 14, 511);
    			add_location(b2, file$5, 17, 18, 568);
    			add_location(li2, file$5, 17, 14, 564);
    			add_location(ul, file$5, 14, 12, 445);
    			attr_dev(li3, "class", "facility svelte-1rb9k9m");
    			add_location(li3, file$5, 12, 10, 342);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li3, anchor);
    			append_dev(li3, a);
    			append_dev(a, t0);
    			append_dev(li3, t1);
    			append_dev(li3, ul);
    			append_dev(ul, li0);
    			append_dev(li0, b0);
    			append_dev(li0, t3);
    			append_dev(li0, t4);
    			append_dev(ul, t5);
    			append_dev(ul, li1);
    			append_dev(li1, b1);
    			append_dev(li1, t7);
    			append_dev(li1, t8);
    			append_dev(ul, t9);
    			append_dev(ul, li2);
    			append_dev(li2, b2);
    			append_dev(li2, t11);
    			append_dev(li2, t12);
    			append_dev(ul, t13);
    			if (if_block) if_block.m(ul, null);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && t0_value !== (t0_value = /*fac*/ ctx[4].name + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*item*/ 1 && a_href_value !== (a_href_value = "#/facility:" + /*fac*/ ctx[4].EPAFacilityID)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*item*/ 1 && t4_value !== (t4_value = /*fac*/ ctx[4].city + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*item*/ 1 && t8_value !== (t8_value = /*fac*/ ctx[4].address + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*item*/ 1 && t12_value !== (t12_value = /*fac*/ ctx[4].EPAFacilityID + "")) set_data_dev(t12, t12_value);

    			if (/*fac*/ ctx[4].names_prev.length) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(ul, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li3);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(12:8) {#each county.facilities as fac}",
    		ctx
    	});

    	return block;
    }

    // (9:4) {#each item.counties as county}
    function create_each_block$3(ctx) {
    	let h3;
    	let t0_value = /*county*/ ctx[1].name + "";
    	let t0;
    	let t1;
    	let ul;
    	let t2;
    	let each_value_1 = /*county*/ ctx[1].facilities;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			add_location(h3, file$5, 9, 6, 236);
    			attr_dev(ul, "id", "facilities-list");
    			add_location(ul, file$5, 10, 6, 265);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, ul, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			append_dev(ul, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && t0_value !== (t0_value = /*county*/ ctx[1].name + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*item*/ 1) {
    				each_value_1 = /*county*/ ctx[1].facilities;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, t2);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(ul);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(9:4) {#each item.counties as county}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let section;
    	let h2;
    	let t0;
    	let t1_value = /*item*/ ctx[0].name + "";
    	let t1;
    	let t2;
    	let div0;
    	let t3;
    	let a;
    	let t5;
    	let div1;
    	let each_value = /*item*/ ctx[0].counties;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			h2 = element("h2");
    			t0 = text("Facilities in ");
    			t1 = text(t1_value);
    			t2 = space();
    			div0 = element("div");
    			t3 = text("⭠ ");
    			a = element("a");
    			a.textContent = "View all states";
    			t5 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h2, file$5, 5, 2, 73);
    			attr_dev(a, "href", "#/list:states");
    			add_location(a, file$5, 6, 9, 117);
    			add_location(div0, file$5, 6, 2, 110);
    			attr_dev(div1, "id", "counties-list");
    			add_location(div1, file$5, 7, 2, 169);
    			attr_dev(section, "id", "state-facilities");
    			add_location(section, file$5, 4, 0, 39);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(section, t2);
    			append_dev(section, div0);
    			append_dev(div0, t3);
    			append_dev(div0, a);
    			append_dev(section, t5);
    			append_dev(section, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*item*/ 1 && t1_value !== (t1_value = /*item*/ ctx[0].name + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*item*/ 1) {
    				each_value = /*item*/ ctx[0].counties;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('State', slots, []);
    	let { item } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (item === undefined && !('item' in $$props || $$self.$$.bound[$$self.$$.props['item']])) {
    			console.warn("<State> was created without expected prop 'item'");
    		}
    	});

    	const writable_props = ['item'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<State> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({ item });

    	$$self.$inject_state = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item];
    }

    class State extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "State",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get item() {
    		throw new Error("<State>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<State>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Facility.svelte generated by Svelte v3.55.1 */

    const file$4 = "src/components/Facility.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (12:34) {#if item.lng}
    function create_if_block$2(ctx) {
    	let t0_value = (/*item*/ ctx[0].lng || "") + "";
    	let t0;
    	let t1;
    	let t2_value = (/*item*/ ctx[0].lat || "") + "";
    	let t2;
    	let t3;
    	let a0;
    	let t4;
    	let a0_href_value;
    	let t5;
    	let a1;
    	let t6;
    	let a1_href_value;
    	let t7;

    	const block = {
    		c: function create() {
    			t0 = text(t0_value);
    			t1 = text(", ");
    			t2 = text(t2_value);
    			t3 = text(" (");
    			a0 = element("a");
    			t4 = text("OSM");
    			t5 = text(" | ");
    			a1 = element("a");
    			t6 = text("Google");
    			t7 = text(")");
    			attr_dev(a0, "href", a0_href_value = "https://www.openstreetmap.org/?zoom=14&mlat=" + /*item*/ ctx[0].lat + "&mlon=" + /*item*/ ctx[0].lng);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "rel", "noreferrer");
    			add_location(a0, file$4, 11, 84, 609);
    			attr_dev(a1, "href", a1_href_value = "https://maps.google.com/maps?q=loc:" + /*item*/ ctx[0].lat + "," + /*item*/ ctx[0].lng);
    			attr_dev(a1, "target", "_blank");
    			attr_dev(a1, "rel", "noreferrer");
    			add_location(a1, file$4, 11, 208, 733);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, a0, anchor);
    			append_dev(a0, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, a1, anchor);
    			append_dev(a1, t6);
    			insert_dev(target, t7, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && t0_value !== (t0_value = (/*item*/ ctx[0].lng || "") + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*item*/ 1 && t2_value !== (t2_value = (/*item*/ ctx[0].lat || "") + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*item*/ 1 && a0_href_value !== (a0_href_value = "https://www.openstreetmap.org/?zoom=14&mlat=" + /*item*/ ctx[0].lat + "&mlon=" + /*item*/ ctx[0].lng)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*item*/ 1 && a1_href_value !== (a1_href_value = "https://maps.google.com/maps?q=loc:" + /*item*/ ctx[0].lat + "," + /*item*/ ctx[0].lng)) {
    				attr_dev(a1, "href", a1_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(a0);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(a1);
    			if (detaching) detach_dev(t7);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(12:34) {#if item.lng}",
    		ctx
    	});

    	return block;
    }

    // (29:4) {#each item.submissions as sub}
    function create_each_block$2(ctx) {
    	let tr;
    	let td0;
    	let a;
    	let t0_value = /*sub*/ ctx[1].id + "";
    	let t0;
    	let a_href_value;
    	let t1;
    	let td1;
    	let t2_value = /*sub*/ ctx[1].date + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*sub*/ ctx[1].name + "";
    	let t4;
    	let t5;
    	let td3;
    	let t6_value = (/*sub*/ ctx[1].company_1 || "") + "";
    	let t6;
    	let t7;
    	let td4;
    	let t8_value = (/*sub*/ ctx[1].company_2 || "") + "";
    	let t8;
    	let t9;
    	let td5;
    	let t10_value = (/*sub*/ ctx[1].operator || "") + "";
    	let t10;
    	let t11;

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			t8 = text(t8_value);
    			t9 = space();
    			td5 = element("td");
    			t10 = text(t10_value);
    			t11 = space();
    			attr_dev(a, "href", a_href_value = "#/submission:" + /*sub*/ ctx[1].id);
    			add_location(a, file$4, 30, 10, 1415);
    			attr_dev(td0, "class", "svelte-173w3nh");
    			add_location(td0, file$4, 30, 6, 1411);
    			set_style(td1, "white-space", "nowrap");
    			attr_dev(td1, "class", "svelte-173w3nh");
    			add_location(td1, file$4, 31, 6, 1471);
    			attr_dev(td2, "class", "svelte-173w3nh");
    			add_location(td2, file$4, 32, 6, 1525);
    			attr_dev(td3, "class", "svelte-173w3nh");
    			add_location(td3, file$4, 33, 6, 1551);
    			attr_dev(td4, "class", "svelte-173w3nh");
    			add_location(td4, file$4, 34, 6, 1588);
    			attr_dev(td5, "class", "svelte-173w3nh");
    			add_location(td5, file$4, 35, 6, 1625);
    			add_location(tr, file$4, 29, 4, 1400);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, a);
    			append_dev(a, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			append_dev(td1, t2);
    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, t4);
    			append_dev(tr, t5);
    			append_dev(tr, td3);
    			append_dev(td3, t6);
    			append_dev(tr, t7);
    			append_dev(tr, td4);
    			append_dev(td4, t8);
    			append_dev(tr, t9);
    			append_dev(tr, td5);
    			append_dev(td5, t10);
    			append_dev(tr, t11);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*item*/ 1 && t0_value !== (t0_value = /*sub*/ ctx[1].id + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*item*/ 1 && a_href_value !== (a_href_value = "#/submission:" + /*sub*/ ctx[1].id)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if (dirty & /*item*/ 1 && t2_value !== (t2_value = /*sub*/ ctx[1].date + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*item*/ 1 && t4_value !== (t4_value = /*sub*/ ctx[1].name + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*item*/ 1 && t6_value !== (t6_value = (/*sub*/ ctx[1].company_1 || "") + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*item*/ 1 && t8_value !== (t8_value = (/*sub*/ ctx[1].company_2 || "") + "")) set_data_dev(t8, t8_value);
    			if (dirty & /*item*/ 1 && t10_value !== (t10_value = (/*sub*/ ctx[1].operator || "") + "")) set_data_dev(t10, t10_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(29:4) {#each item.submissions as sub}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let section;
    	let h2;
    	let t0;
    	let t1_value = /*item*/ ctx[0].name + "";
    	let t1;
    	let t2;
    	let ul;
    	let li0;
    	let b0;
    	let t4;
    	let span0;
    	let a0;
    	let t5_value = /*item*/ ctx[0].EPAFacilityID + "";
    	let t5;
    	let a0_href_value;
    	let t6;
    	let li1;
    	let b1;
    	let t8;
    	let span1;
    	let a1;
    	let t9_value = (/*item*/ ctx[0].state || "") + "";
    	let t9;
    	let a1_href_value;
    	let t10;
    	let li2;
    	let b2;
    	let t12;
    	let span2;
    	let t13_value = (/*item*/ ctx[0].city || "") + "";
    	let t13;
    	let t14;
    	let li3;
    	let b3;
    	let t16;
    	let span3;
    	let t17_value = (/*item*/ ctx[0].zip || "") + "";
    	let t17;
    	let t18;
    	let li4;
    	let b4;
    	let t20;
    	let span4;
    	let t21;
    	let li5;
    	let b5;
    	let t23;
    	let span5;
    	let t24_value = (/*item*/ ctx[0].company_1 || "") + "";
    	let t24;
    	let t25;
    	let li6;
    	let b6;
    	let t27;
    	let span6;
    	let t28_value = (/*item*/ ctx[0].company_2 || "") + "";
    	let t28;
    	let t29;
    	let li7;
    	let b7;
    	let t31;
    	let span7;
    	let t32_value = (/*item*/ ctx[0].operator || "") + "";
    	let t32;
    	let t33;
    	let h3;
    	let t35;
    	let table;
    	let thead;
    	let tr;
    	let th0;
    	let t37;
    	let th1;
    	let t39;
    	let th2;
    	let t41;
    	let th3;
    	let t43;
    	let th4;
    	let t45;
    	let th5;
    	let t47;
    	let if_block = /*item*/ ctx[0].lng && create_if_block$2(ctx);
    	let each_value = /*item*/ ctx[0].submissions;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			h2 = element("h2");
    			t0 = text("Facility: ");
    			t1 = text(t1_value);
    			t2 = space();
    			ul = element("ul");
    			li0 = element("li");
    			b0 = element("b");
    			b0.textContent = "EPA Facility ID:";
    			t4 = space();
    			span0 = element("span");
    			a0 = element("a");
    			t5 = text(t5_value);
    			t6 = space();
    			li1 = element("li");
    			b1 = element("b");
    			b1.textContent = "State:";
    			t8 = space();
    			span1 = element("span");
    			a1 = element("a");
    			t9 = text(t9_value);
    			t10 = space();
    			li2 = element("li");
    			b2 = element("b");
    			b2.textContent = "City:";
    			t12 = space();
    			span2 = element("span");
    			t13 = text(t13_value);
    			t14 = space();
    			li3 = element("li");
    			b3 = element("b");
    			b3.textContent = "ZIP Code:";
    			t16 = space();
    			span3 = element("span");
    			t17 = text(t17_value);
    			t18 = space();
    			li4 = element("li");
    			b4 = element("b");
    			b4.textContent = "Coordinates:";
    			t20 = space();
    			span4 = element("span");
    			if (if_block) if_block.c();
    			t21 = space();
    			li5 = element("li");
    			b5 = element("b");
    			b5.textContent = "Company 1:";
    			t23 = space();
    			span5 = element("span");
    			t24 = text(t24_value);
    			t25 = space();
    			li6 = element("li");
    			b6 = element("b");
    			b6.textContent = "Company 2:";
    			t27 = space();
    			span6 = element("span");
    			t28 = text(t28_value);
    			t29 = space();
    			li7 = element("li");
    			b7 = element("b");
    			b7.textContent = "Operator:";
    			t31 = space();
    			span7 = element("span");
    			t32 = text(t32_value);
    			t33 = space();
    			h3 = element("h3");
    			h3.textContent = "RMP Submissions (through March 2022)";
    			t35 = space();
    			table = element("table");
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			th0.textContent = "Sub. #";
    			t37 = space();
    			th1 = element("th");
    			th1.textContent = "Date EPA Validated";
    			t39 = space();
    			th2 = element("th");
    			th2.textContent = "Fac. Name";
    			t41 = space();
    			th3 = element("th");
    			th3.textContent = "Co. 1";
    			t43 = space();
    			th4 = element("th");
    			th4.textContent = "Co. 2";
    			t45 = space();
    			th5 = element("th");
    			th5.textContent = "Op.";
    			t47 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h2, file$4, 5, 2, 65);
    			add_location(b0, file$4, 7, 8, 133);
    			attr_dev(a0, "href", a0_href_value = "https://echo.epa.gov/detailed-facility-report?fid=" + /*item*/ ctx[0].EPAFacilityID);
    			attr_dev(a0, "target", "_blank");
    			attr_dev(a0, "rel", "noreferrer");
    			add_location(a0, file$4, 7, 38, 163);
    			add_location(span0, file$4, 7, 32, 157);
    			add_location(li0, file$4, 7, 4, 129);
    			add_location(b1, file$4, 8, 8, 322);
    			attr_dev(a1, "href", a1_href_value = "#/state:" + /*item*/ ctx[0].state);
    			add_location(a1, file$4, 8, 28, 342);
    			add_location(span1, file$4, 8, 22, 336);
    			add_location(li1, file$4, 8, 4, 318);
    			add_location(b2, file$4, 9, 8, 416);
    			add_location(span2, file$4, 9, 21, 429);
    			add_location(li2, file$4, 9, 4, 412);
    			add_location(b3, file$4, 10, 8, 473);
    			add_location(span3, file$4, 10, 25, 490);
    			add_location(li3, file$4, 10, 4, 469);
    			add_location(b4, file$4, 11, 8, 533);
    			add_location(span4, file$4, 11, 28, 553);
    			add_location(li4, file$4, 11, 4, 529);
    			add_location(b5, file$4, 12, 8, 870);
    			add_location(span5, file$4, 12, 26, 888);
    			add_location(li5, file$4, 12, 4, 866);
    			add_location(b6, file$4, 13, 8, 937);
    			add_location(span6, file$4, 13, 26, 955);
    			add_location(li6, file$4, 13, 4, 933);
    			add_location(b7, file$4, 14, 8, 1004);
    			add_location(span7, file$4, 14, 25, 1021);
    			add_location(li7, file$4, 14, 4, 1000);
    			attr_dev(ul, "id", "facility-details");
    			attr_dev(ul, "class", "svelte-173w3nh");
    			add_location(ul, file$4, 6, 2, 98);
    			attr_dev(h3, "class", "svelte-173w3nh");
    			add_location(h3, file$4, 16, 2, 1071);
    			add_location(th0, file$4, 20, 8, 1179);
    			add_location(th1, file$4, 21, 8, 1203);
    			add_location(th2, file$4, 22, 8, 1239);
    			add_location(th3, file$4, 23, 8, 1266);
    			add_location(th4, file$4, 24, 8, 1294);
    			add_location(th5, file$4, 25, 8, 1322);
    			add_location(tr, file$4, 19, 6, 1166);
    			add_location(thead, file$4, 18, 4, 1152);
    			attr_dev(table, "id", "submission-list");
    			attr_dev(table, "class", "svelte-173w3nh");
    			add_location(table, file$4, 17, 2, 1119);
    			attr_dev(section, "id", "facility");
    			add_location(section, file$4, 4, 0, 39);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(section, t2);
    			append_dev(section, ul);
    			append_dev(ul, li0);
    			append_dev(li0, b0);
    			append_dev(li0, t4);
    			append_dev(li0, span0);
    			append_dev(span0, a0);
    			append_dev(a0, t5);
    			append_dev(ul, t6);
    			append_dev(ul, li1);
    			append_dev(li1, b1);
    			append_dev(li1, t8);
    			append_dev(li1, span1);
    			append_dev(span1, a1);
    			append_dev(a1, t9);
    			append_dev(ul, t10);
    			append_dev(ul, li2);
    			append_dev(li2, b2);
    			append_dev(li2, t12);
    			append_dev(li2, span2);
    			append_dev(span2, t13);
    			append_dev(ul, t14);
    			append_dev(ul, li3);
    			append_dev(li3, b3);
    			append_dev(li3, t16);
    			append_dev(li3, span3);
    			append_dev(span3, t17);
    			append_dev(ul, t18);
    			append_dev(ul, li4);
    			append_dev(li4, b4);
    			append_dev(li4, t20);
    			append_dev(li4, span4);
    			if (if_block) if_block.m(span4, null);
    			append_dev(ul, t21);
    			append_dev(ul, li5);
    			append_dev(li5, b5);
    			append_dev(li5, t23);
    			append_dev(li5, span5);
    			append_dev(span5, t24);
    			append_dev(ul, t25);
    			append_dev(ul, li6);
    			append_dev(li6, b6);
    			append_dev(li6, t27);
    			append_dev(li6, span6);
    			append_dev(span6, t28);
    			append_dev(ul, t29);
    			append_dev(ul, li7);
    			append_dev(li7, b7);
    			append_dev(li7, t31);
    			append_dev(li7, span7);
    			append_dev(span7, t32);
    			append_dev(section, t33);
    			append_dev(section, h3);
    			append_dev(section, t35);
    			append_dev(section, table);
    			append_dev(table, thead);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t37);
    			append_dev(tr, th1);
    			append_dev(tr, t39);
    			append_dev(tr, th2);
    			append_dev(tr, t41);
    			append_dev(tr, th3);
    			append_dev(tr, t43);
    			append_dev(tr, th4);
    			append_dev(tr, t45);
    			append_dev(tr, th5);
    			append_dev(table, t47);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(table, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*item*/ 1 && t1_value !== (t1_value = /*item*/ ctx[0].name + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*item*/ 1 && t5_value !== (t5_value = /*item*/ ctx[0].EPAFacilityID + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*item*/ 1 && a0_href_value !== (a0_href_value = "https://echo.epa.gov/detailed-facility-report?fid=" + /*item*/ ctx[0].EPAFacilityID)) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*item*/ 1 && t9_value !== (t9_value = (/*item*/ ctx[0].state || "") + "")) set_data_dev(t9, t9_value);

    			if (dirty & /*item*/ 1 && a1_href_value !== (a1_href_value = "#/state:" + /*item*/ ctx[0].state)) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*item*/ 1 && t13_value !== (t13_value = (/*item*/ ctx[0].city || "") + "")) set_data_dev(t13, t13_value);
    			if (dirty & /*item*/ 1 && t17_value !== (t17_value = (/*item*/ ctx[0].zip || "") + "")) set_data_dev(t17, t17_value);

    			if (/*item*/ ctx[0].lng) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(span4, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*item*/ 1 && t24_value !== (t24_value = (/*item*/ ctx[0].company_1 || "") + "")) set_data_dev(t24, t24_value);
    			if (dirty & /*item*/ 1 && t28_value !== (t28_value = (/*item*/ ctx[0].company_2 || "") + "")) set_data_dev(t28, t28_value);
    			if (dirty & /*item*/ 1 && t32_value !== (t32_value = (/*item*/ ctx[0].operator || "") + "")) set_data_dev(t32, t32_value);

    			if (dirty & /*item*/ 1) {
    				each_value = /*item*/ ctx[0].submissions;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(table, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Facility', slots, []);
    	let { item } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (item === undefined && !('item' in $$props || $$self.$$.bound[$$self.$$.props['item']])) {
    			console.warn("<Facility> was created without expected prop 'item'");
    		}
    	});

    	const writable_props = ['item'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Facility> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({ item });

    	$$self.$inject_state = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item];
    }

    class Facility extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Facility",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get item() {
    		throw new Error("<Facility>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Facility>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var ChemicalID = {
    	"0": "Public OCA Chemical",
    	"1": "Formaldehyde (solution)",
    	"2": "1,1-Dimethylhydrazine  [Hydrazine, 1,1-dimethyl-]",
    	"3": "Methyl hydrazine  [Hydrazine, methyl-]",
    	"4": "Chloroform  [Methane, trichloro-]",
    	"5": "Methyl chloride  [Methane, chloro-]",
    	"6": "Hydrocyanic acid",
    	"7": "Methyl mercaptan  [Methanethiol]",
    	"8": "Carbon disulfide",
    	"9": "Ethylene oxide  [Oxirane]",
    	"10": "Phosgene  [Carbonic dichloride]",
    	"11": "Propyleneimine  [Aziridine, 2-methyl-]",
    	"12": "Propylene oxide  [Oxirane, methyl-]",
    	"13": "Tetramethyllead  [Plumbane, tetramethyl-]",
    	"14": "Trimethylchlorosilane  [Silane, chlorotrimethyl-]",
    	"15": "Dimethyldichlorosilane  [Silane, dichlorodimethyl-]",
    	"16": "Methyltrichlorosilane  [Silane, trichloromethyl-]",
    	"17": "Isobutyronitrile  [Propanenitrile, 2-methyl-]",
    	"18": "Peracetic acid  [Ethaneperoxoic acid]",
    	"19": "Methyl chloroformate  [Carbonochloridic acid, methylester]",
    	"20": "Toluene 2,6-diisocyanate  [Benzene, 1,3-diisocyanato-2-methyl-]",
    	"21": "Epichlorohydrin  [Oxirane, (chloromethyl)-]",
    	"22": "Acrolein  [2-Propenal]",
    	"23": "Allylamine  [2-Propen-1-amine]",
    	"24": "Propionitrile  [Propanenitrile]",
    	"25": "Acrylonitrile  [2-Propenenitrile]",
    	"26": "Ethylenediamine  [1,2-Ethanediamine]",
    	"27": "Allyl alcohol  [2-Propen-1-ol]",
    	"28": "Chloromethyl methyl ether  [Methane, chloromethoxy-]",
    	"29": "Vinyl acetate monomer  [Acetic acid ethenyl ester]",
    	"30": "Isopropyl chloroformate  [Carbonochloridic acid, 1-methylethy ester]",
    	"31": "Cyclohexylamine  [Cyclohexanamine]",
    	"32": "Propyl chloroformate  [Carbonochloridic acid, propylester]",
    	"33": "Furan",
    	"34": "Piperidine",
    	"35": "Crotonaldehyde, (E)-  [2-Butenal, (E)-]",
    	"36": "Methacrylonitrile  [2-Propenenitrile, 2-methyl-]",
    	"37": "Ethyleneimine  [Aziridine]",
    	"38": "Hydrazine",
    	"39": "Boron trifluoride compound with methyl ether (1:1)  [Boron, trifluoro[oxybis[metane]]-, T-4-",
    	"40": "Cyanogen chloride",
    	"41": "Tetranitromethane  [Methane, tetranitro-]",
    	"42": "Chloromethyl ether  [Methane, oxybis[chloro-]",
    	"43": "Methyl thiocyanate  [Thiocyanic acid, methyl ester]",
    	"44": "Toluene 2,4-diisocyanate  [Benzene, 2,4-diisocyanato-1-methyl-]",
    	"45": "Perchloromethylmercaptan [Methanesulfenyl chloride, trichloro-]",
    	"46": "Methyl isocyanate  [Methane, isocyanato-]",
    	"47": "Acrylyl chloride  [2-Propenoyl chloride]",
    	"48": "Crotonaldehyde  [2-Butenal]",
    	"49": "Sulfur dioxide (anhydrous)",
    	"50": "Sulfur trioxide",
    	"51": "Titanium tetrachloride  [Titanium chloride (TiCl4) (T-4)-]",
    	"52": "Boron trifluoride  [Borane, trifluoro-]",
    	"53": "Hydrochloric acid (conc 37% or greater)",
    	"54": "Hydrogen chloride (anhydrous) [Hydrochloric acid]",
    	"55": "Hydrogen fluoride/Hydrofluoric acid (conc 50% or greater) [Hydrofluoric acid]",
    	"56": "Ammonia (anhydrous)",
    	"57": "Ammonia (conc 20% or greater)",
    	"58": "Nitric acid (conc 80% or greater)",
    	"59": "Phosphorus trichloride  [Phosphorous trichloride]",
    	"60": "Bromine",
    	"61": "Fluorine",
    	"62": "Chlorine",
    	"63": "Hydrogen sulfide",
    	"64": "Hydrogen selenide",
    	"65": "Sulfur tetrafluoride  [Sulfur fluoride (SF4), (T-4)-]",
    	"66": "Arsenous trichloride",
    	"67": "Arsine",
    	"68": "Phosphine",
    	"69": "Oleum (Fuming Sulfuric acid)  [Sulfuric acid, mixture with sulfur trioxide]",
    	"70": "Phosphorus oxychloride  [Phosphoryl chloride]",
    	"71": "Chlorine dioxide  [Chlorine oxide (ClO2)]",
    	"72": "Nitric oxide  [Nitrogen oxide (NO)]",
    	"73": "Boron trichloride  [Borane, trichloro-]",
    	"74": "Nickel carbonyl",
    	"75": "Iron, pentacarbonyl-  [Iron carbonyl (Fe(CO)5), (TB-5-11)-]",
    	"76": "Diborane",
    	"77": "Toluene diisocyanate (unspecified isomer)  [Benzene, 1,3-diisocyanatomethyl-]",
    	"78": "CBI Acids",
    	"79": "CBI Amines, Ammonia, and Hydrazines",
    	"80": "CBI Arsenic and Phosphorus Compunds",
    	"81": "CBI Boron Compounds",
    	"82": "CBI Carbonyl Compounds",
    	"83": "CBI Cyanides and Nitriles",
    	"84": "CBI Esters, Alcohols, Aldehydes, and Furans",
    	"85": "CBI Halogenated Organic Compunds",
    	"86": "CBI Halogens and Halogen Oxides",
    	"87": "CBI Isocyanates and Isothiocyanates",
    	"88": "CBI Nitrogen Oxides and Organic Nitro Compounds",
    	"89": "CBI Organic Silanes",
    	"90": "CBI Oxiranes and Azirdines",
    	"91": "CBI Selenium and Sulfer Compunds",
    	"92": "Ethyl ether  [Ethane, 1,1'-oxybis-]",
    	"93": "Methane",
    	"94": "Ethane",
    	"95": "Ethylene  [Ethene]",
    	"96": "Acetylene  [Ethyne]",
    	"97": "Methylamine  [Methanamine]",
    	"98": "Propane",
    	"99": "Propyne  [1-Propyne]",
    	"100": "Ethyl chloride  [Ethane, chloro-]",
    	"101": "Vinyl chloride  [Ethene, chloro-]",
    	"102": "Vinyl fluoride  [Ethene, fluoro-]",
    	"103": "Ethylamine  [Ethanamine]",
    	"104": "Acetaldehyde",
    	"105": "Ethyl mercaptan [Ethanethiol]",
    	"106": "Cyclopropane",
    	"107": "Isobutane  [Propane, 2-methyl]",
    	"108": "Isopropyl chloride [Propane, 2-chloro-]",
    	"109": "Isopropylamine [2-Propanamine]",
    	"110": "Vinylidene chloride [Ethene, 1,1-dichloro-]",
    	"111": "Difluoroethane  [Ethane, 1,1-difluoro-]",
    	"112": "Vinylidene fluoride [Ethene, 1,1-difluoro-]",
    	"113": "Trimethylamine [Methanamine, N,N-dimethyl-]",
    	"114": "Tetramethylsilane  [Silane, tetramethyl-]",
    	"115": "Isopentane  [Butane, 2-methyl-]",
    	"116": "Isoprene  [1,3-Butadiene, 2-methyl-]",
    	"117": "Trifluorochloroethylene [Ethene, chlorotrifluoro-]",
    	"118": "Butane",
    	"119": "1-Butene",
    	"120": "1,3-Butadiene",
    	"121": "Ethyl acetylene  [1-Butyne]",
    	"122": "2-Butene",
    	"123": "Vinyl methyl ether  [Ethene, methoxy-]",
    	"124": "Methyl formate  [Formic acid, methyl ester]",
    	"125": "Pentane",
    	"126": "1-Pentene",
    	"127": "Vinyl ethyl ether  [Ethene, ethoxy-]",
    	"128": "Ethyl nitrite  [Nitrous acid, ethyl ester]",
    	"129": "Propylene  [1-Propene]",
    	"130": "Methyl ether  [Methane, oxybis-]",
    	"131": "2-Methylpropene  [1-Propene, 2-methyl-]",
    	"132": "Tetrafluoroethylene [Ethene, tetrafluoro-]",
    	"133": "Dimethylamine  [Methanamine, N-methyl-]",
    	"134": "Cyanogen  [Ethanedinitrile]",
    	"135": "Propadiene  [1,2-Propadiene]",
    	"136": "Carbon oxysulfide  [Carbon oxide sulfide (COS)]",
    	"137": "2,2-Dimethylpropane [Propane, 2,2-dimethyl-]",
    	"138": "1,3-Pentadiene",
    	"139": "2-Chloropropylene [1-Propene, 2-chloro-]",
    	"140": "3-Methyl-1-butene",
    	"141": "2-Methyl-1-butene",
    	"142": "2-Butene-cis",
    	"143": "1-Chloropropylene [1-Propene, 1-chloro-]",
    	"144": "Bromotrifluorethylene [Ethene, bromotrifluoro-]",
    	"145": "2-Butene-trans  [2-Butene, (E)]",
    	"146": "2-Pentene, (Z)-",
    	"147": "2-Pentene, (E)-",
    	"148": "Vinyl acetylene [1-Buten-3-yne]",
    	"149": "Hydrogen",
    	"150": "Dichlorosilane  [Silane, dichloro-]",
    	"151": "Chlorine monoxide  [Chlorine oxide]",
    	"152": "Silane",
    	"153": "Trichlorosilane  [Silane, trichloro-]",
    	"154": "Butene",
    	"155": "Flammable Mixture",
    	"156": "CBI Flammable Substance",
    	"157": "Hydrochloric acid (conc 30% or greater)",
    	"158": "Hydrogen fluoride/Hydrofluoric acid (conc 40% or greater)",
    	"159": "Nitric acid (conc 40% or greater)",
    	"160": "Nitrogen Tetroxide"
    };
    var NAICSCode = {
    	"11": "Agriculture, Forestry, Fishing and Hunting",
    	"21": "Mining, Quarrying, and Oil and Gas Extraction",
    	"22": "Utilities",
    	"23": "Construction",
    	"31": "Manufacturing of Food, Textiles, Apparel, and Leather Products",
    	"32": "Manufacturing of Wood, Paper, Petroleum, Coal, Chemical, and Nonmetallic Minerals",
    	"33": "Manufacturing of Metal, Electronic, Computer, Furniture, and Other Products",
    	"42": "Wholesale Trade",
    	"44": "Retail Trade for Automotive, Food, Clothing, Home Furnishings, and Other Necessities",
    	"45": "Retail Trade for Sporting Goods, Hobbies, Books, Music, and General Merchandise",
    	"48": "Transportation and Warehousing",
    	"49": "Transportation and Warehousing",
    	"51": "Information",
    	"52": "Finance and Insurance",
    	"53": "Real Estate and Rental and Leasing",
    	"54": "Professional, Scientific, and Technical Services",
    	"55": "Management of Companies and Enterprises",
    	"56": "Administrative and Support and Waste Management and Remediation Services",
    	"61": "Educational Services",
    	"62": "Health Care and Social Assistance",
    	"71": "Arts, Entertainment, and Recreation",
    	"72": "Accommodation and Food Services",
    	"81": "Other Services (except Public Administration)",
    	"92": "Public Administration",
    	"99": "Unclassified Establishments",
    	"111": "Crop Production",
    	"112": "Animal Production and Aquaculture",
    	"113": "Forestry and Logging",
    	"114": "Fishing, Hunting and Trapping",
    	"115": "Support Activities for Agriculture and Forestry",
    	"211": "Oil and Gas Extraction",
    	"212": "Mining (except Oil and Gas)",
    	"213": "Support Activities for Mining",
    	"221": "Utilities",
    	"233": "Building, Developing and General Contracting",
    	"234": "Heavy Construction",
    	"235": "Special Trade Contractors",
    	"236": "Construction of Buildings",
    	"237": "Heavy and Civil Engineering Construction",
    	"238": "Specialty Trade Contractors",
    	"311": "Food Manufacturing",
    	"312": "Beverage and Tobacco Product Manufacturing",
    	"313": "Textile Mills",
    	"314": "Textile Product Mills",
    	"315": "Apparel Manufacturing",
    	"316": "Leather and Allied Product Manufacturing",
    	"321": "Wood Product Manufacturing",
    	"322": "Paper Manufacturing",
    	"323": "Printing and Related Support Activities",
    	"324": "Petroleum and Coal Products Manufacturing",
    	"325": "Chemical Manufacturing",
    	"326": "Plastics and Rubber Products Manufacturing",
    	"327": "Nonmetallic Mineral Product Manufacturing",
    	"331": "Primary Metal Manufacturing",
    	"332": "Fabricated Metal Product Manufacturing",
    	"333": "Machinery Manufacturing",
    	"334": "Computer and Electronic Product Manufacturing",
    	"335": "Electrical Equipment, Appliance, and Component Manufacturing",
    	"336": "Transportation Equipment Manufacturing",
    	"337": "Furniture and Related Product Manufacturing",
    	"339": "Miscellaneous Manufacturing",
    	"421": "Wholesale Trade, Durable Goods",
    	"422": "Wholesale Trade, Nondurable Goods",
    	"423": "Merchant Wholesalers, Durable Goods",
    	"424": "Merchant Wholesalers, Nondurable Goods",
    	"425": "Wholesale Electronic Markets and Agents and Brokers",
    	"441": "Motor Vehicle and Parts Dealers",
    	"442": "Furniture and Home Furnishings Stores",
    	"443": "Electronics and Appliance Stores",
    	"444": "Building Material and Garden Equipment and Supplies Dealers",
    	"445": "Food and Beverage Stores",
    	"446": "Health and Personal Care Stores",
    	"447": "Gasoline Stations",
    	"448": "Clothing and Clothing Accessories Stores",
    	"451": "Sporting Goods, Hobby, Musical Instrument, and Book Stores",
    	"452": "General Merchandise Stores",
    	"453": "Miscellaneous Store Retailers",
    	"454": "Nonstore Retailers",
    	"481": "Air Transportation",
    	"482": "Rail Transportation",
    	"483": "Water Transportation",
    	"484": "Truck Transportation",
    	"485": "Transit and Ground Passenger Transportation",
    	"486": "Pipeline Transportation",
    	"487": "Scenic and Sightseeing Transportation",
    	"488": "Support Activities for Transportation",
    	"491": "Postal Service",
    	"492": "Couriers and Messengers",
    	"493": "Warehousing and Storage",
    	"511": "Publishing Industries (except Internet)",
    	"512": "Motion Picture and Sound Recording Industries",
    	"513": "Broadcasting and Telecommunications",
    	"514": "Information Services and Data Processing Services",
    	"515": "Broadcasting (except Internet)",
    	"516": "Internet Publishing and Broadcasting",
    	"517": "Telecommunications",
    	"518": "Data Processing, Hosting, and Related Services",
    	"519": "Other Information Services",
    	"521": "Monetary Authorities - Central Bank",
    	"522": "Credit Intermediation and Related Activities",
    	"523": "Securities, Commodity Contracts, and Other Financial Investments and Related Activities",
    	"524": "Insurance Carriers and Related Activities",
    	"525": "Funds, Trusts, and Other Financial Vehicles",
    	"531": "Real Estate",
    	"532": "Rental and Leasing Services",
    	"533": "Lessors of Nonfinancial Intangible Assets (except Copyrighted Works)",
    	"541": "Professional, Scientific, and Technical Services",
    	"551": "Management of Companies and Enterprises",
    	"561": "Administrative and Support Services",
    	"562": "Waste Management and Remediation Services",
    	"611": "Educational Services",
    	"621": "Ambulatory Health Care Services",
    	"622": "Hospitals",
    	"623": "Nursing and Residential Care Facilities",
    	"624": "Social Assistance",
    	"711": "Performing Arts, Spectator Sports, and Related Industries",
    	"712": "Museums, Historical Sites, and Similar Institutions",
    	"713": "Amusement, Gambling, and Recreation Industries",
    	"721": "Accommodation",
    	"722": "Food Services and Drinking Places",
    	"811": "Repair and Maintenance",
    	"812": "Personal and Laundry Services",
    	"813": "Religious, Grantmaking, Civic, Professional, and Similar Organizations",
    	"814": "Private Households",
    	"921": "Executive, Legislative, and Other General Government Support",
    	"922": "Justice, Public Order, and Safety Activities",
    	"923": "Administration of Human Resource Programs",
    	"924": "Administration of Environmental Quality Programs",
    	"925": "Administration of Housing Programs, Urban Planning, and Community Development",
    	"926": "Administration of Economic Programs",
    	"927": "Space Research and Technology",
    	"928": "National Security and International Affairs",
    	"999": "Unclassified Establishments",
    	"1111": "Oilseed and Grain Farming",
    	"1112": "Vegetable and Melon Farming",
    	"1113": "Fruit and Tree Nut Farming",
    	"1114": "Greenhouse, Nursery, and Floriculture Production",
    	"1119": "Other Crop Farming",
    	"1121": "Cattle Ranching and Farming",
    	"1122": "Hog and Pig Farming",
    	"1123": "Poultry and Egg Production",
    	"1124": "Sheep and Goat Farming",
    	"1125": "Aquaculture",
    	"1129": "Other Animal Production",
    	"1131": "Timber Tract Operations",
    	"1132": "Forest Nurseries and Gathering of Forest Products",
    	"1133": "Logging",
    	"1141": "Fishing",
    	"1142": "Hunting and Trapping",
    	"1151": "Support Activities for Crop Production",
    	"1152": "Support Activities for Animal Production",
    	"1153": "Support Activities for Forestry",
    	"2111": "Oil and Gas Extraction",
    	"2121": "Coal Mining",
    	"2122": "Metal Ore Mining",
    	"2123": "Nonmetallic Mineral Mining and Quarrying",
    	"2131": "Support Activities for Mining",
    	"2211": "Electric Power Generation, Transmission and Distribution",
    	"2212": "Natural Gas Distribution",
    	"2213": "Water, Sewage and Other Systems",
    	"2331": "Land Subdivision and Land Development",
    	"2332": "Residential Building Construction",
    	"2333": "Nonresidential Building Construction",
    	"2341": "Highway, Street, Bridge and Tunnel Construction",
    	"2349": "Other Heavy Construction",
    	"2351": "Plumbing, Heating and Air-Conditioning Contractors",
    	"2352": "Painting and Wall Covering Contractors",
    	"2353": "Electrical Contractors",
    	"2354": "Masonry, Drywall, Insulation, and Tile Contractors",
    	"2355": "Carpentry and Floor Contractors",
    	"2356": "Roofing, Siding and Sheet Metal Contractors",
    	"2357": "Concrete Contractors",
    	"2358": "Water Well Drilling Contractors",
    	"2359": "Other Special Trade Contractors",
    	"2361": "Residential Building Construction",
    	"2362": "Nonresidential Building Construction",
    	"2371": "Utility System Construction",
    	"2372": "Land Subdivision",
    	"2373": "Highway, Street, and Bridge Construction",
    	"2379": "Other Heavy and Civil Engineering Construction",
    	"2381": "Foundation, Structure, and Building Exterior Contractors",
    	"2382": "Building Equipment Contractors",
    	"2383": "Building Finishing Contractors",
    	"2389": "Other Specialty Trade Contractors",
    	"3111": "Animal Food Manufacturing",
    	"3112": "Grain and Oilseed Milling",
    	"3113": "Sugar and Confectionery Product Manufacturing",
    	"3114": "Fruit and Vegetable Preserving and Specialty Food Manufacturing",
    	"3115": "Dairy Product Manufacturing",
    	"3116": "Animal Slaughtering and Processing",
    	"3117": "Seafood Product Preparation and Packaging",
    	"3118": "Bakeries and Tortilla Manufacturing",
    	"3119": "Other Food Manufacturing",
    	"3121": "Beverage Manufacturing",
    	"3122": "Tobacco Manufacturing",
    	"3131": "Fiber, Yarn, and Thread Mills",
    	"3132": "Fabric Mills",
    	"3133": "Textile and Fabric Finishing and Fabric Coating Mills",
    	"3141": "Textile Furnishings Mills",
    	"3149": "Other Textile Product Mills",
    	"3151": "Apparel Knitting Mills",
    	"3152": "Cut and Sew Apparel Manufacturing",
    	"3159": "Apparel Accessories and Other Apparel Manufacturing",
    	"3161": "Leather and Hide Tanning and Finishing",
    	"3162": "Footwear Manufacturing",
    	"3169": "Other Leather and Allied Product Manufacturing",
    	"3211": "Sawmills and Wood Preservation",
    	"3212": "Veneer, Plywood, and Engineered Wood Product Manufacturing",
    	"3219": "Other Wood Product Manufacturing",
    	"3221": "Pulp, Paper, and Paperboard Mills",
    	"3222": "Converted Paper Product Manufacturing",
    	"3231": "Printing and Related Support Activities",
    	"3241": "Petroleum and Coal Products Manufacturing",
    	"3251": "Basic Chemical Manufacturing",
    	"3252": "Resin, Synthetic Rubber, and Artificial Synthetic Fibers and Filaments Manufacturing",
    	"3253": "Pesticide, Fertilizer, and Other Agricultural Chemical Manufacturing",
    	"3254": "Pharmaceutical and Medicine Manufacturing",
    	"3255": "Paint, Coating, and Adhesive Manufacturing",
    	"3256": "Soap, Cleaning Compound, and Toilet Preparation Manufacturing",
    	"3259": "Other Chemical Product and Preparation Manufacturing",
    	"3261": "Plastics Product Manufacturing",
    	"3262": "Rubber Product Manufacturing",
    	"3271": "Clay Product and Refractory Manufacturing",
    	"3272": "Glass and Glass Product Manufacturing",
    	"3273": "Cement and Concrete Product Manufacturing",
    	"3274": "Lime and Gypsum Product Manufacturing",
    	"3279": "Other Nonmetallic Mineral Product Manufacturing",
    	"3311": "Iron and Steel Mills and Ferroalloy Manufacturing",
    	"3312": "Steel Product Manufacturing from Purchased Steel",
    	"3313": "Alumina and Aluminum Production and Processing",
    	"3314": "Nonferrous Metal (except Aluminum) Production and Processing",
    	"3315": "Foundries",
    	"3321": "Forging and Stamping",
    	"3322": "Cutlery and Handtool Manufacturing",
    	"3323": "Architectural and Structural Metals Manufacturing",
    	"3324": "Boiler, Tank, and Shipping Container Manufacturing",
    	"3325": "Hardware Manufacturing",
    	"3326": "Spring and Wire Product Manufacturing",
    	"3327": "Machine Shops; Turned Product; and Screw, Nut, and Bolt Manufacturing",
    	"3328": "Coating, Engraving, Heat Treating, and Allied Activities",
    	"3329": "Other Fabricated Metal Product Manufacturing",
    	"3331": "Agriculture, Construction, and Mining Machinery Manufacturing",
    	"3332": "Industrial Machinery Manufacturing",
    	"3333": "Commercial and Service Industry Machinery Manufacturing",
    	"3334": "Ventilation, Heating, Air-Conditioning, and Commercial Refrigeration Equipment Manufacturing",
    	"3335": "Metalworking Machinery Manufacturing",
    	"3336": "Engine, Turbine, and Power Transmission Equipment Manufacturing",
    	"3339": "Other General Purpose Machinery Manufacturing",
    	"3341": "Computer and Peripheral Equipment Manufacturing",
    	"3342": "Communications Equipment Manufacturing",
    	"3343": "Audio and Video Equipment Manufacturing",
    	"3344": "Semiconductor and Other Electronic Component Manufacturing",
    	"3345": "Navigational, Measuring, Electromedical, and Control Instruments Manufacturing",
    	"3346": "Manufacturing and Reproducing Magnetic and Optical Media",
    	"3351": "Electric Lighting Equipment Manufacturing",
    	"3352": "Household Appliance Manufacturing",
    	"3353": "Electrical Equipment Manufacturing",
    	"3359": "Other Electrical Equipment and Component Manufacturing",
    	"3361": "Motor Vehicle Manufacturing",
    	"3362": "Motor Vehicle Body and Trailer Manufacturing",
    	"3363": "Motor Vehicle Parts Manufacturing",
    	"3364": "Aerospace Product and Parts Manufacturing",
    	"3365": "Railroad Rolling Stock Manufacturing",
    	"3366": "Ship and Boat Building",
    	"3369": "Other Transportation Equipment Manufacturing",
    	"3371": "Household and Institutional Furniture and Kitchen Cabinet Manufacturing",
    	"3372": "Office Furniture (including Fixtures) Manufacturing",
    	"3379": "Other Furniture Related Product Manufacturing",
    	"3391": "Medical Equipment and Supplies Manufacturing",
    	"3399": "Other Miscellaneous Manufacturing",
    	"4211": "Motor Vehicle and Motor Vehicle Part and Supplies Wholesalers",
    	"4212": "Furniture and Home Furnishing Wholesalers",
    	"4213": "Lumber and Other Construction Materials Wholesalers",
    	"4214": "Professional and Commercial Equipment and Supplies Wholesalers",
    	"4215": "Metal and Mineral (except Petroleum) Wholesalers",
    	"4216": "Electrical Goods Wholesalers",
    	"4217": "Hardware, and Plumbing and Heating Equipment and Supplies Wholesalers",
    	"4218": "Machinery, Equipment and Supplies Wholesalers",
    	"4219": "Miscellaneous Durable Goods Wholesalers",
    	"4221": "Paper and Paper Product Wholesalers",
    	"4222": "Drug, Drug Proprietaries and Druggists' Sundries Wholesalers",
    	"4223": "Apparel, Piece Goods, and Notions Wholesalers",
    	"4224": "Grocery and Related Product Wholesalers",
    	"4225": "Farm Product Raw Material Wholesalers",
    	"4226": "Chemical and Allied Products Wholesalers",
    	"4227": "Petroleum and Petroleum Products Wholesalers",
    	"4228": "Beer, Wine, and Distilled Alcoholic Beverage Wholesalers",
    	"4229": "Miscellaneous Nondurable Goods Wholesalers",
    	"4231": "Motor Vehicle and Motor Vehicle Parts and Supplies Merchant Wholesalers",
    	"4232": "Furniture and Home Furnishing Merchant Wholesalers",
    	"4233": "Lumber and Other Construction Materials Merchant Wholesalers",
    	"4234": "Professional and Commercial Equipment and Supplies Merchant Wholesalers",
    	"4235": "Metal and Mineral (except Petroleum) Merchant Wholesalers",
    	"4236": "Household Appliances and Electrical and Electronic Goods Merchant Wholesalers",
    	"4237": "Hardware, and Plumbing and Heating Equipment and Supplies Merchant Wholesalers",
    	"4238": "Machinery, Equipment, and Supplies Merchant Wholesalers",
    	"4239": "Miscellaneous Durable Goods Merchant Wholesalers",
    	"4241": "Paper and Paper Product Merchant Wholesalers",
    	"4242": "Drugs and Druggists' Sundries Merchant Wholesalers",
    	"4243": "Apparel, Piece Goods, and Notions Merchant Wholesalers",
    	"4244": "Grocery and Related Product Merchant Wholesalers",
    	"4245": "Farm Product Raw Material Merchant Wholesalers",
    	"4246": "Chemical and Allied Products Merchant Wholesalers",
    	"4247": "Petroleum and Petroleum Products Merchant Wholesalers",
    	"4248": "Beer, Wine, and Distilled Alcoholic Beverage Merchant Wholesalers",
    	"4249": "Miscellaneous Nondurable Goods Merchant Wholesalers",
    	"4251": "Wholesale Electronic Markets and Agents and Brokers",
    	"4411": "Automobile Dealers",
    	"4412": "Other Motor Vehicle Dealers",
    	"4413": "Automotive Parts, Accessories, and Tire Stores",
    	"4421": "Furniture Stores",
    	"4422": "Home Furnishings Stores",
    	"4431": "Electronics and Appliance Stores",
    	"4441": "Building Material and Supplies Dealers",
    	"4442": "Lawn and Garden Equipment and Supplies Stores",
    	"4451": "Grocery Stores",
    	"4452": "Specialty Food Stores",
    	"4453": "Beer, Wine, and Liquor Stores",
    	"4461": "Health and Personal Care Stores",
    	"4471": "Gasoline Stations",
    	"4481": "Clothing Stores",
    	"4482": "Shoe Stores",
    	"4483": "Jewelry, Luggage, and Leather Goods Stores",
    	"4511": "Sporting Goods, Hobby, and Musical Instrument Stores",
    	"4512": "Book Stores and News Dealers",
    	"4521": "Department Stores",
    	"4522": "Department Stores",
    	"4523": "General Merchandise Stores, including Warehouse Clubs and Supercenters",
    	"4529": "Other General Merchandise Stores",
    	"4531": "Florists",
    	"4532": "Office Supplies, Stationery, and Gift Stores",
    	"4533": "Used Merchandise Stores",
    	"4539": "Other Miscellaneous Store Retailers",
    	"4541": "Electronic Shopping and Mail-Order Houses",
    	"4542": "Vending Machine Operators",
    	"4543": "Direct Selling Establishments",
    	"4811": "Scheduled Air Transportation",
    	"4812": "Nonscheduled Air Transportation",
    	"4821": "Rail Transportation",
    	"4831": "Deep Sea, Coastal, and Great Lakes Water Transportation",
    	"4832": "Inland Water Transportation",
    	"4841": "General Freight Trucking",
    	"4842": "Specialized Freight Trucking",
    	"4851": "Urban Transit Systems",
    	"4852": "Interurban and Rural Bus Transportation",
    	"4853": "Taxi and Limousine Service",
    	"4854": "School and Employee Bus Transportation",
    	"4855": "Charter Bus Industry",
    	"4859": "Other Transit and Ground Passenger Transportation",
    	"4861": "Pipeline Transportation of Crude Oil",
    	"4862": "Pipeline Transportation of Natural Gas",
    	"4869": "Other Pipeline Transportation",
    	"4871": "Scenic and Sightseeing Transportation, Land",
    	"4872": "Scenic and Sightseeing Transportation, Water",
    	"4879": "Scenic and Sightseeing Transportation, Other",
    	"4881": "Support Activities for Air Transportation",
    	"4882": "Support Activities for Rail Transportation",
    	"4883": "Support Activities for Water Transportation",
    	"4884": "Support Activities for Road Transportation",
    	"4885": "Freight Transportation Arrangement",
    	"4889": "Other Support Activities for Transportation",
    	"4911": "Postal Service",
    	"4921": "Couriers and Express Delivery Services",
    	"4922": "Local Messengers and Local Delivery",
    	"4931": "Warehousing and Storage",
    	"5111": "Newspaper, Periodical, Book, and Directory Publishers",
    	"5112": "Software Publishers",
    	"5121": "Motion Picture and Video Industries",
    	"5122": "Sound Recording Industries",
    	"5131": "Radio and Television Broadcasting",
    	"5132": "Cable Networks and Program Distribution",
    	"5133": "Telecommunications",
    	"5141": "Information Services",
    	"5142": "Data Processing Services",
    	"5151": "Radio and Television Broadcasting",
    	"5152": "Cable and Other Subscription Programming",
    	"5161": "Internet Publishing and Broadcasting",
    	"5171": "Wired Telecommunications Carriers",
    	"5172": "Wireless Telecommunications Carriers (except Satellite)",
    	"5173": "Wired and Wireless Telecommunications Carriers",
    	"5174": "Satellite Telecommunications",
    	"5175": "Cable and Other Program Distribution",
    	"5179": "Other Telecommunications",
    	"5181": "Internet Service Providers and Web Search Portals",
    	"5182": "Data Processing, Hosting, and Related Services",
    	"5191": "Other Information Services",
    	"5211": "Monetary Authorities - Central Bank",
    	"5221": "Depository Credit Intermediation",
    	"5222": "Nondepository Credit Intermediation",
    	"5223": "Activities Related to Credit Intermediation",
    	"5231": "Securities and Commodity Contracts Intermediation and Brokerage",
    	"5232": "Securities and Commodity Exchanges",
    	"5239": "Other Financial Investment Activities",
    	"5241": "Insurance Carriers",
    	"5242": "Agencies, Brokerages, and Other Insurance Related Activities",
    	"5251": "Insurance and Employee Benefit Funds",
    	"5259": "Other Investment Pools and Funds",
    	"5311": "Lessors of Real Estate",
    	"5312": "Offices of Real Estate Agents and Brokers",
    	"5313": "Activities Related to Real Estate",
    	"5321": "Automotive Equipment Rental and Leasing",
    	"5322": "Consumer Goods Rental",
    	"5323": "General Rental Centers",
    	"5324": "Commercial and Industrial Machinery and Equipment Rental and Leasing",
    	"5331": "Lessors of Nonfinancial Intangible Assets (except Copyrighted Works)",
    	"5411": "Legal Services",
    	"5412": "Accounting, Tax Preparation, Bookkeeping, and Payroll Services",
    	"5413": "Architectural, Engineering, and Related Services",
    	"5414": "Specialized Design Services",
    	"5415": "Computer Systems Design and Related Services",
    	"5416": "Management, Scientific, and Technical Consulting Services",
    	"5417": "Scientific Research and Development Services",
    	"5418": "Advertising, Public Relations, and Related Services",
    	"5419": "Other Professional, Scientific, and Technical Services",
    	"5511": "Management of Companies and Enterprises",
    	"5611": "Office Administrative Services",
    	"5612": "Facilities Support Services",
    	"5613": "Employment Services",
    	"5614": "Business Support Services",
    	"5615": "Travel Arrangement and Reservation Services",
    	"5616": "Investigation and Security Services",
    	"5617": "Services to Buildings and Dwellings",
    	"5619": "Other Support Services",
    	"5621": "Waste Collection",
    	"5622": "Waste Treatment and Disposal",
    	"5629": "Remediation and Other Waste Management Services",
    	"6111": "Elementary and Secondary Schools",
    	"6112": "Junior Colleges",
    	"6113": "Colleges, Universities, and Professional Schools",
    	"6114": "Business Schools and Computer and Management Training",
    	"6115": "Technical and Trade Schools",
    	"6116": "Other Schools and Instruction",
    	"6117": "Educational Support Services",
    	"6211": "Offices of Physicians",
    	"6212": "Offices of Dentists",
    	"6213": "Offices of Other Health Practitioners",
    	"6214": "Outpatient Care Centers",
    	"6215": "Medical and Diagnostic Laboratories",
    	"6216": "Home Health Care Services",
    	"6219": "Other Ambulatory Health Care Services",
    	"6221": "General Medical and Surgical Hospitals",
    	"6222": "Psychiatric and Substance Abuse Hospitals",
    	"6223": "Specialty (except Psychiatric and Substance Abuse) Hospitals",
    	"6231": "Nursing Care Facilities (Skilled Nursing Facilities)",
    	"6232": "Residential Intellectual and Developmental Disability, Mental Health, and Substance Abuse Facilities",
    	"6233": "Continuing Care Retirement Communities and Assisted Living Facilities for the Elderly",
    	"6239": "Other Residential Care Facilities",
    	"6241": "Individual and Family Services",
    	"6242": "Community Food and Housing, and Emergency and Other Relief Services",
    	"6243": "Vocational Rehabilitation Services",
    	"6244": "Child Day Care Services",
    	"7111": "Performing Arts Companies",
    	"7112": "Spectator Sports",
    	"7113": "Promoters of Performing Arts, Sports, and Similar Events",
    	"7114": "Agents and Managers for Artists, Athletes, Entertainers, and Other Public Figures",
    	"7115": "Independent Artists, Writers, and Performers",
    	"7121": "Museums, Historical Sites, and Similar Institutions",
    	"7131": "Amusement Parks and Arcades",
    	"7132": "Gambling Industries",
    	"7139": "Other Amusement and Recreation Industries",
    	"7211": "Traveler Accommodation",
    	"7212": "RV (Recreational Vehicle) Parks and Recreational Camps",
    	"7213": "Rooming and Boarding Houses, Dormitories, and Workers' Camps",
    	"7221": "Full-Service Restaurants",
    	"7222": "Limited-Service Eating Places",
    	"7223": "Special Food Services",
    	"7224": "Drinking Places (Alcoholic Beverages)",
    	"7225": "Restaurants and Other Eating Places",
    	"8111": "Automotive Repair and Maintenance",
    	"8112": "Electronic and Precision Equipment Repair and Maintenance",
    	"8113": "Commercial and Industrial Machinery and Equipment (except Automotive and Electronic) Repair and Maintenance",
    	"8114": "Personal and Household Goods Repair and Maintenance",
    	"8121": "Personal Care Services",
    	"8122": "Death Care Services",
    	"8123": "Drycleaning and Laundry Services",
    	"8129": "Other Personal Services",
    	"8131": "Religious Organizations",
    	"8132": "Grantmaking and Giving Services",
    	"8133": "Social Advocacy Organizations",
    	"8134": "Civic and Social Organizations",
    	"8139": "Business, Professional, Labor, Political, and Similar Organizations",
    	"8141": "Private Households",
    	"9211": "Executive, Legislative, and Other General Government Support",
    	"9221": "Justice, Public Order, and Safety Activities",
    	"9231": "Administration of Human Resource Programs",
    	"9241": "Administration of Environmental Quality Programs",
    	"9251": "Administration of Housing Programs, Urban Planning, and Community Development",
    	"9261": "Administration of Economic Programs",
    	"9271": "Space Research and Technology",
    	"9281": "National Security and International Affairs",
    	"9999": "Unclassified Establishments",
    	"11111": "Soybean Farming",
    	"11112": "Oilseed (except Soybean) Farming",
    	"11113": "Dry Pea and Bean Farming",
    	"11114": "Wheat Farming",
    	"11115": "Corn Farming",
    	"11116": "Rice Farming",
    	"11119": "Other Grain Farming",
    	"11121": "Vegetable and Melon Farming",
    	"11131": "Orange Groves",
    	"11132": "Citrus (except Orange) Groves",
    	"11133": "Noncitrus Fruit and Tree Nut Farming",
    	"11141": "Food Crops Grown Under Cover",
    	"11142": "Nursery and Floriculture Production",
    	"11191": "Tobacco Farming",
    	"11192": "Cotton Farming",
    	"11193": "Sugarcane Farming",
    	"11194": "Hay Farming",
    	"11199": "All Other Crop Farming",
    	"11211": "Beef Cattle Ranching and Farming, including Feedlots",
    	"11212": "Dairy Cattle and Milk Production",
    	"11213": "Dual-Purpose Cattle Ranching and Farming",
    	"11221": "Hog and Pig Farming",
    	"11231": "Chicken Egg Production",
    	"11232": "Broilers and Other Meat Type Chicken Production",
    	"11233": "Turkey Production",
    	"11234": "Poultry Hatcheries",
    	"11239": "Other Poultry Production",
    	"11241": "Sheep Farming",
    	"11242": "Goat Farming",
    	"11251": "Aquaculture",
    	"11291": "Apiculture",
    	"11292": "Horses and Other Equine Production",
    	"11293": "Fur-Bearing Animal and Rabbit Production",
    	"11299": "All Other Animal Production",
    	"11311": "Timber Tract Operations",
    	"11321": "Forest Nurseries and Gathering of Forest Products",
    	"11331": "Logging",
    	"11411": "Fishing",
    	"11421": "Hunting and Trapping",
    	"11511": "Support Activities for Crop Production",
    	"11521": "Support Activities for Animal Production",
    	"11531": "Support Activities for Forestry",
    	"21111": "Oil and Gas Extraction",
    	"21112": "Crude Petroleum Extraction",
    	"21113": "Natural Gas Extraction",
    	"21211": "Coal Mining",
    	"21221": "Iron Ore Mining",
    	"21222": "Gold Ore and Silver Ore Mining",
    	"21223": "Copper, Nickel, Lead, and Zinc Mining",
    	"21229": "Other Metal Ore Mining",
    	"21231": "Stone Mining and Quarrying",
    	"21232": "Sand, Gravel, Clay, and Ceramic and Refractory Minerals Mining and Quarrying",
    	"21239": "Other Nonmetallic Mineral Mining and Quarrying",
    	"21311": "Support Activities for Mining",
    	"22111": "Electric Power Generation",
    	"22112": "Electric Power Transmission, Control, and Distribution",
    	"22121": "Natural Gas Distribution",
    	"22131": "Water Supply and Irrigation Systems",
    	"22132": "Sewage Treatment Facilities",
    	"22133": "Steam and Air-Conditioning Supply",
    	"23311": "Land Subdivision and Land Development",
    	"23321": "Single Family Housing Construction",
    	"23322": "Multifamily Housing Construction",
    	"23331": "Manufacturing and Industrial Building Construction",
    	"23332": "Commercial and Institutional Building Construction",
    	"23411": "Highway and Street Construction",
    	"23412": "Bridge and Tunnel Construction",
    	"23491": "Water, Sewer, and Pipeline Construction",
    	"23492": "Power and Communication Transmission Line Construction",
    	"23493": "Industrial Nonbuilding Structure Construction",
    	"23499": "All Other Heavy Construction",
    	"23511": "Plumbing, Heating, and Air-conditioning Contractors",
    	"23521": "Painting and Wall Covering Contractors",
    	"23531": "Electrical Contractors",
    	"23541": "Masonry and Stone Contractors",
    	"23542": "Drywall, Plastering, Acoustical, and Insulation Contractors",
    	"23543": "Tile, Marble, Terrazzo, and Mosaic Contractors",
    	"23551": "Carpentry Contractors",
    	"23552": "Floor Laying and Other Floor Contractors",
    	"23561": "Roofing, Siding, and Sheet Metal Contractors",
    	"23571": "Concrete Contractors",
    	"23581": "Water Well Drilling Contractors",
    	"23591": "Structural Steel Erection Contractors",
    	"23592": "Glass and Glazing Contractors",
    	"23593": "Excavation Contractors",
    	"23594": "Wrecking and Demolition Contractors",
    	"23595": "Building Equipment and Other Machinery Installation Contractors",
    	"23599": "All Other Special Trade Contractors",
    	"23611": "Residential Building Construction",
    	"23621": "Industrial Building Construction",
    	"23622": "Commercial and Institutional Building Construction",
    	"23711": "Water and Sewer Line and Related Structures Construction",
    	"23712": "Oil and Gas Pipeline and Related Structures Construction",
    	"23713": "Power and Communication Line and Related Structures Construction",
    	"23721": "Land Subdivision",
    	"23731": "Highway, Street, and Bridge Construction",
    	"23799": "Other Heavy and Civil Engineering Construction",
    	"23811": "Poured Concrete Foundation and Structure Contractors",
    	"23812": "Structural Steel and Precast Concrete Contractors",
    	"23813": "Framing Contractors",
    	"23814": "Masonry Contractors",
    	"23815": "Glass and Glazing Contractors",
    	"23816": "Roofing Contractors",
    	"23817": "Siding Contractors",
    	"23819": "Other Foundation, Structure, and Building Exterior Contractors",
    	"23821": "Electrical Contractors and Other Wiring Installation Contractors",
    	"23822": "Plumbing, Heating, and Air-Conditioning Contractors",
    	"23829": "Other Building Equipment Contractors",
    	"23831": "Drywall and Insulation Contractors",
    	"23832": "Painting and Wall Covering Contractors",
    	"23833": "Flooring Contractors",
    	"23834": "Tile and Terrazzo Contractors",
    	"23835": "Finish Carpentry Contractors",
    	"23839": "Other Building Finishing Contractors",
    	"23891": "Site Preparation Contractors",
    	"23899": "All Other Specialty Trade Contractors",
    	"31111": "Animal Food Manufacturing",
    	"31121": "Flour Milling and Malt Manufacturing",
    	"31122": "Starch and Vegetable Fats and Oils Manufacturing",
    	"31123": "Breakfast Cereal Manufacturing",
    	"31131": "Sugar Manufacturing",
    	"31132": "Chocolate and Confectionery Manufacturing from Cacao Beans",
    	"31133": "Confectionery Manufacturing from Purchased Chocolate",
    	"31134": "Nonchocolate Confectionery Manufacturing",
    	"31135": "Chocolate and Confectionery Manufacturing",
    	"31141": "Frozen Food Manufacturing",
    	"31142": "Fruit and Vegetable Canning, Pickling, and Drying",
    	"31151": "Dairy Product (except Frozen) Manufacturing",
    	"31152": "Ice Cream and Frozen Dessert Manufacturing",
    	"31161": "Animal Slaughtering and Processing",
    	"31171": "Seafood Product Preparation and Packaging",
    	"31181": "Bread and Bakery Product Manufacturing",
    	"31182": "Cookie, Cracker, and Pasta Manufacturing",
    	"31183": "Tortilla Manufacturing",
    	"31191": "Snack Food Manufacturing",
    	"31192": "Coffee and Tea Manufacturing",
    	"31193": "Flavoring Syrup and Concentrate Manufacturing",
    	"31194": "Seasoning and Dressing Manufacturing",
    	"31199": "All Other Food Manufacturing",
    	"31211": "Soft Drink and Ice Manufacturing",
    	"31212": "Breweries",
    	"31213": "Wineries",
    	"31214": "Distilleries",
    	"31221": "Tobacco Stemming and Redrying",
    	"31222": "Tobacco Product Manufacturing",
    	"31223": "Tobacco Manufacturing",
    	"31311": "Fiber, Yarn, and Thread Mills",
    	"31321": "Broadwoven Fabric Mills",
    	"31322": "Narrow Fabric Mills and Schiffli Machine Embroidery",
    	"31323": "Nonwoven Fabric Mills",
    	"31324": "Knit Fabric Mills",
    	"31331": "Textile and Fabric Finishing Mills",
    	"31332": "Fabric Coating Mills",
    	"31411": "Carpet and Rug Mills",
    	"31412": "Curtain and Linen Mills",
    	"31491": "Textile Bag and Canvas Mills",
    	"31499": "All Other Textile Product Mills",
    	"31511": "Hosiery and Sock Mills",
    	"31519": "Other Apparel Knitting Mills",
    	"31521": "Cut and Sew Apparel Contractors",
    	"31522": "Men's and Boys' Cut and Sew Apparel Manufacturing",
    	"31523": "Women's and Girls' Cut and Sew Apparel Manufacturing",
    	"31524": "Women's, Girls', and Infants' Cut and Sew Apparel Manufacturing",
    	"31528": "Other Cut and Sew Apparel Manufacturing",
    	"31529": "Other Cut and Sew Apparel Manufacturing",
    	"31599": "Apparel Accessories and Other Apparel Manufacturing",
    	"31611": "Leather and Hide Tanning and Finishing",
    	"31621": "Footwear Manufacturing",
    	"31699": "Other Leather and Allied Product Manufacturing",
    	"32111": "Sawmills and Wood Preservation",
    	"32121": "Veneer, Plywood, and Engineered Wood Product Manufacturing",
    	"32191": "Millwork",
    	"32192": "Wood Container and Pallet Manufacturing",
    	"32199": "All Other Wood Product Manufacturing",
    	"32211": "Pulp Mills",
    	"32212": "Paper Mills",
    	"32213": "Paperboard Mills",
    	"32221": "Paperboard Container Manufacturing",
    	"32222": "Paper Bag and Coated and Treated Paper Manufacturing",
    	"32223": "Stationery Product Manufacturing",
    	"32229": "Other Converted Paper Product Manufacturing",
    	"32311": "Printing",
    	"32312": "Support Activities for Printing",
    	"32411": "Petroleum Refineries",
    	"32412": "Asphalt Paving, Roofing, and Saturated Materials Manufacturing",
    	"32419": "Other Petroleum and Coal Products Manufacturing",
    	"32511": "Petrochemical Manufacturing",
    	"32512": "Industrial Gas Manufacturing",
    	"32513": "Synthetic Dye and Pigment Manufacturing",
    	"32518": "Other Basic Inorganic Chemical Manufacturing",
    	"32519": "Other Basic Organic Chemical Manufacturing",
    	"32521": "Resin and Synthetic Rubber Manufacturing",
    	"32522": "Artificial and Synthetic Fibers and Filaments Manufacturing",
    	"32531": "Fertilizer Manufacturing",
    	"32532": "Pesticide and Other Agricultural Chemical Manufacturing",
    	"32541": "Pharmaceutical and Medicine Manufacturing",
    	"32551": "Paint and Coating Manufacturing",
    	"32552": "Adhesive Manufacturing",
    	"32561": "Soap and Cleaning Compound Manufacturing",
    	"32562": "Toilet Preparation Manufacturing",
    	"32591": "Printing Ink Manufacturing",
    	"32592": "Explosives Manufacturing",
    	"32599": "All Other Chemical Product and Preparation Manufacturing",
    	"32611": "Plastics Packaging Materials and Unlaminated Film and Sheet Manufacturing",
    	"32612": "Plastics Pipe, Pipe Fitting, and Unlaminated Profile Shape Manufacturing",
    	"32613": "Laminated Plastics Plate, Sheet (except Packaging), and Shape Manufacturing",
    	"32614": "Polystyrene Foam Product Manufacturing",
    	"32615": "Urethane and Other Foam Product (except Polystyrene) Manufacturing",
    	"32616": "Plastics Bottle Manufacturing",
    	"32619": "Other Plastics Product Manufacturing",
    	"32621": "Tire Manufacturing",
    	"32622": "Rubber and Plastics Hoses and Belting Manufacturing",
    	"32629": "Other Rubber Product Manufacturing",
    	"32711": "Pottery, Ceramics, and Plumbing Fixture Manufacturing",
    	"32712": "Clay Building Material and Refractories Manufacturing",
    	"32721": "Glass and Glass Product Manufacturing",
    	"32731": "Cement Manufacturing",
    	"32732": "Ready-Mix Concrete Manufacturing",
    	"32733": "Concrete Pipe, Brick, and Block Manufacturing",
    	"32739": "Other Concrete Product Manufacturing",
    	"32741": "Lime Manufacturing",
    	"32742": "Gypsum Product Manufacturing",
    	"32791": "Abrasive Product Manufacturing",
    	"32799": "All Other Nonmetallic Mineral Product Manufacturing",
    	"33111": "Iron and Steel Mills and Ferroalloy Manufacturing",
    	"33121": "Iron and Steel Pipe and Tube Manufacturing from Purchased Steel",
    	"33122": "Rolling and Drawing of Purchased Steel",
    	"33131": "Alumina and Aluminum Production and Processing",
    	"33141": "Nonferrous Metal (except Aluminum) Smelting and Refining",
    	"33142": "Copper Rolling, Drawing, Extruding, and Alloying",
    	"33149": "Nonferrous Metal (except Copper and Aluminum) Rolling, Drawing, Extruding, and Alloying",
    	"33151": "Ferrous Metal Foundries",
    	"33152": "Nonferrous Metal Foundries",
    	"33211": "Forging and Stamping",
    	"33221": "Cutlery and Handtool Manufacturing",
    	"33231": "Plate Work and Fabricated Structural Product Manufacturing",
    	"33232": "Ornamental and Architectural Metal Products Manufacturing",
    	"33241": "Power Boiler and Heat Exchanger Manufacturing",
    	"33242": "Metal Tank (Heavy Gauge) Manufacturing",
    	"33243": "Metal Can, Box, and Other Metal Container (Light Gauge) Manufacturing",
    	"33251": "Hardware Manufacturing",
    	"33261": "Spring and Wire Product Manufacturing",
    	"33271": "Machine Shops",
    	"33272": "Turned Product and Screw, Nut, and Bolt Manufacturing",
    	"33281": "Coating, Engraving, Heat Treating, and Allied Activities",
    	"33291": "Metal Valve Manufacturing",
    	"33299": "All Other Fabricated Metal Product Manufacturing",
    	"33311": "Agricultural Implement Manufacturing",
    	"33312": "Construction Machinery Manufacturing",
    	"33313": "Mining and Oil and Gas Field Machinery Manufacturing",
    	"33321": "Sawmill and Woodworking Machinery Manufacturing",
    	"33322": "Plastics and Rubber Industry Machinery Manufacturing",
    	"33324": "Industrial Machinery Manufacturing",
    	"33329": "Other Industrial Machinery Manufacturing",
    	"33331": "Commercial and Service Industry Machinery Manufacturing",
    	"33341": "Ventilation, Heating, Air-Conditioning, and Commercial Refrigeration Equipment Manufacturing",
    	"33351": "Metalworking Machinery Manufacturing",
    	"33361": "Engine, Turbine, and Power Transmission Equipment Manufacturing",
    	"33391": "Pump and Compressor Manufacturing",
    	"33392": "Material Handling Equipment Manufacturing",
    	"33399": "All Other General Purpose Machinery Manufacturing",
    	"33411": "Computer and Peripheral Equipment Manufacturing",
    	"33421": "Telephone Apparatus Manufacturing",
    	"33422": "Radio and Television Broadcasting and Wireless Communications Equipment Manufacturing",
    	"33429": "Other Communications Equipment Manufacturing",
    	"33431": "Audio and Video Equipment Manufacturing",
    	"33441": "Semiconductor and Other Electronic Component Manufacturing",
    	"33451": "Navigational, Measuring, Electromedical, and Control Instruments Manufacturing",
    	"33461": "Manufacturing and Reproducing Magnetic and Optical Media",
    	"33511": "Electric Lamp Bulb and Part Manufacturing",
    	"33512": "Lighting Fixture Manufacturing",
    	"33521": "Small Electrical Appliance Manufacturing",
    	"33522": "Major Household Appliance Manufacturing",
    	"33531": "Electrical Equipment Manufacturing",
    	"33591": "Battery Manufacturing",
    	"33592": "Communication and Energy Wire and Cable Manufacturing",
    	"33593": "Wiring Device Manufacturing",
    	"33599": "All Other Electrical Equipment and Component Manufacturing",
    	"33611": "Automobile and Light Duty Motor Vehicle Manufacturing",
    	"33612": "Heavy Duty Truck Manufacturing",
    	"33621": "Motor Vehicle Body and Trailer Manufacturing",
    	"33631": "Motor Vehicle Gasoline Engine and Engine Parts Manufacturing",
    	"33632": "Motor Vehicle Electrical and Electronic Equipment Manufacturing",
    	"33633": "Motor Vehicle Steering and Suspension Components (except Spring) Manufacturing",
    	"33634": "Motor Vehicle Brake System Manufacturing",
    	"33635": "Motor Vehicle Transmission and Power Train Parts Manufacturing",
    	"33636": "Motor Vehicle Seating and Interior Trim Manufacturing",
    	"33637": "Motor Vehicle Metal Stamping",
    	"33639": "Other Motor Vehicle Parts Manufacturing",
    	"33641": "Aerospace Product and Parts Manufacturing",
    	"33651": "Railroad Rolling Stock Manufacturing",
    	"33661": "Ship and Boat Building",
    	"33699": "Other Transportation Equipment Manufacturing",
    	"33711": "Wood Kitchen Cabinet and Countertop Manufacturing",
    	"33712": "Household and Institutional Furniture Manufacturing",
    	"33721": "Office Furniture (including Fixtures) Manufacturing",
    	"33791": "Mattress Manufacturing",
    	"33792": "Blind and Shade Manufacturing",
    	"33911": "Medical Equipment and Supplies Manufacturing",
    	"33991": "Jewelry and Silverware Manufacturing",
    	"33992": "Sporting and Athletic Goods Manufacturing",
    	"33993": "Doll, Toy, and Game Manufacturing",
    	"33994": "Office Supplies (except Paper) Manufacturing",
    	"33995": "Sign Manufacturing",
    	"33999": "All Other Miscellaneous Manufacturing",
    	"42111": "Automobile and Other Motor Vehicle Wholesalers",
    	"42112": "Motor Vehicle Supplies and New Parts Wholesalers",
    	"42113": "Tire and Tube Wholesalers",
    	"42114": "Motor Vehicle Parts (used) Wholesalers",
    	"42121": "Furniture Wholesalers",
    	"42122": "Home Furnishing Wholesalers",
    	"42131": "Lumber, Plywood, Millwork, and Wood Panel Wholesalers",
    	"42132": "Brick, Stone, and Related Construction Material Wholesalers",
    	"42133": "Roofing, Siding, and Insulation Material Wholesalers",
    	"42139": "Other Construction Material Wholesalers",
    	"42141": "Photographic Equipment and Supplies Wholesalers",
    	"42142": "Office Equipment Wholesalers",
    	"42143": "Computer and Computer Peripheral Equipment and Software Wholesalers",
    	"42144": "Other Commercial Equipment Wholesalers",
    	"42145": "Medical, Dental, and Hospital Equipment and Supplies Wholesalers",
    	"42146": "Ophthalmic Goods Wholesalers",
    	"42149": "Other Professional Equipment and Supplies Wholesalers",
    	"42151": "Metal Service Centers and Offices",
    	"42152": "Coal and Other Mineral and Ore Wholesalers",
    	"42161": "Electrical Apparatus and Equipment, Wiring Supplies, and Construction Material Wholesalers",
    	"42162": "Electrical Appliance, Television, and Radio Set Wholesalers",
    	"42169": "Other Electronic Parts and Equipment Wholesalers",
    	"42171": "Hardware Wholesalers",
    	"42172": "Plumbing and Heating Equipment and Supplies (hydronics) Wholesalers",
    	"42173": "Warm Air Heating and Air-conditioning Equipment and Supplies Wholesalers",
    	"42174": "Refrigeration Equipment and Supplies Wholesalers",
    	"42181": "Construction and Mining (Except Oil Well) Machinery and Equipment Wholesalers",
    	"42182": "Farm and Garden Machinery and Equipment Wholesalers",
    	"42183": "Industrial Machinery and Equipment Wholesalers",
    	"42184": "Industrial Supplies Wholesalers",
    	"42185": "Service Establishment Equipment and Supplies Wholesalers",
    	"42186": "Transportation Equipment and Supplies (Except Motor Vehicle) Wholesalers",
    	"42191": "Sporting and Recreational Goods and Supplies Wholesalers",
    	"42192": "Toy and Hobby Goods and Supplies Wholesalers",
    	"42193": "Recyclable Material Wholesalers",
    	"42194": "Jewelry, Watch, Precious Stone, and Precious Metal Wholesalers",
    	"42199": "Other Miscellaneous Durable Goods Wholesalers",
    	"42211": "Printing and Writing Paper Wholesalers",
    	"42212": "Stationery and Office Supplies Wholesalers",
    	"42213": "Industrial and Personal Service Paper Wholesalers",
    	"42221": "Drugs and Druggists' Sundries Wholesalers",
    	"42231": "Piece Goods, Notions, and Other Dry Goods Wholesalers",
    	"42232": "Men's and Boys' Clothing and Furnishings Wholesalers",
    	"42233": "Women's, Children's, and Infants' Clothing and Accessories Wholesalers",
    	"42234": "Footwear Wholesalers",
    	"42241": "General Line Grocery Wholesalers",
    	"42242": "Packaged Frozen Food Wholesalers",
    	"42243": "Dairy Product (Except Dried or Canned) Wholesalers",
    	"42244": "Poultry and Poultry Product Wholesalers",
    	"42245": "Confectionery Wholesalers",
    	"42246": "Fish and Seafood Wholesalers",
    	"42247": "Meat and Meat Product Wholesalers",
    	"42248": "Fresh Fruit and Vegetable Wholesalers",
    	"42249": "Other Grocery and Related Products Wholesalers",
    	"42251": "Grain and Field Bean Wholesalers",
    	"42252": "Livestock Wholesalers",
    	"42259": "Other Farm Product Raw Material Wholesalers",
    	"42261": "Plastics Materials and Basic Forms and Shapes Wholesalers",
    	"42269": "Other Chemical and Allied Products Wholesalers",
    	"42271": "Petroleum Bulk Stations and Terminals",
    	"42272": "Petroleum and Petroleum Products Wholesalers (Except Bulk Stations and Terminals)",
    	"42281": "Beer and Ale Wholesalers",
    	"42282": "Wine and Distilled Alcoholic Beverage Wholesalers",
    	"42291": "Farm Supplies Wholesalers",
    	"42292": "Book, Periodical, and Newspaper Wholesalers",
    	"42293": "Flower, Nursery Stock, and Florists' Supplies Wholesalers",
    	"42294": "Tobacco and Tobacco Product Wholesalers",
    	"42295": "Paint, Varnish, and Supplies Wholesalers",
    	"42299": "Other Miscellaneous Nondurable Goods Wholesalers",
    	"42311": "Automobile and Other Motor Vehicle Merchant Wholesalers",
    	"42312": "Motor Vehicle Supplies and New Parts Merchant Wholesalers",
    	"42313": "Tire and Tube Merchant Wholesalers",
    	"42314": "Motor Vehicle Parts (Used) Merchant Wholesalers",
    	"42321": "Furniture Merchant Wholesalers",
    	"42322": "Home Furnishing Merchant Wholesalers",
    	"42331": "Lumber, Plywood, Millwork, and Wood Panel Merchant Wholesalers",
    	"42332": "Brick, Stone, and Related Construction Material Merchant Wholesalers",
    	"42333": "Roofing, Siding, and Insulation Material Merchant Wholesalers",
    	"42339": "Other Construction Material Merchant Wholesalers",
    	"42341": "Photographic Equipment and Supplies Merchant Wholesalers",
    	"42342": "Office Equipment Merchant Wholesalers",
    	"42343": "Computer and Computer Peripheral Equipment and Software Merchant Wholesalers",
    	"42344": "Other Commercial Equipment Merchant Wholesalers",
    	"42345": "Medical, Dental, and Hospital Equipment and Supplies Merchant Wholesalers",
    	"42346": "Ophthalmic Goods Merchant Wholesalers",
    	"42349": "Other Professional Equipment and Supplies Merchant Wholesalers",
    	"42351": "Metal Service Centers and Other Metal Merchant Wholesalers",
    	"42352": "Coal and Other Mineral and Ore Merchant Wholesalers",
    	"42361": "Electrical Apparatus and Equipment, Wiring Supplies, and Related Equipment Merchant Wholesalers",
    	"42362": "Household Appliances, Electric Housewares, and Consumer Electronics Merchant Wholesalers",
    	"42369": "Other Electronic Parts and Equipment Merchant Wholesalers",
    	"42371": "Hardware Merchant Wholesalers",
    	"42372": "Plumbing and Heating Equipment and Supplies (Hydronics) Merchant Wholesalers",
    	"42373": "Warm Air Heating and Air-Conditioning Equipment and Supplies Merchant Wholesalers",
    	"42374": "Refrigeration Equipment and Supplies Merchant Wholesalers",
    	"42381": "Construction and Mining (except Oil Well) Machinery and Equipment Merchant Wholesalers",
    	"42382": "Farm and Garden Machinery and Equipment Merchant Wholesalers",
    	"42383": "Industrial Machinery and Equipment Merchant Wholesalers",
    	"42384": "Industrial Supplies Merchant Wholesalers",
    	"42385": "Service Establishment Equipment and Supplies Merchant Wholesalers",
    	"42386": "Transportation Equipment and Supplies (except Motor Vehicle) Merchant Wholesalers",
    	"42391": "Sporting and Recreational Goods and Supplies Merchant Wholesalers",
    	"42392": "Toy and Hobby Goods and Supplies Merchant Wholesalers",
    	"42393": "Recyclable Material Merchant Wholesalers",
    	"42394": "Jewelry, Watch, Precious Stone, and Precious Metal Merchant Wholesalers",
    	"42399": "Other Miscellaneous Durable Goods Merchant Wholesalers",
    	"42411": "Printing and Writing Paper Merchant Wholesalers",
    	"42412": "Stationery and Office Supplies Merchant Wholesalers",
    	"42413": "Industrial and Personal Service Paper Merchant Wholesalers",
    	"42421": "Drugs and Druggists' Sundries Merchant Wholesalers",
    	"42431": "Piece Goods, Notions, and Other Dry Goods Merchant Wholesalers",
    	"42432": "Men's and Boys' Clothing and Furnishings Merchant Wholesalers",
    	"42433": "Women's, Children's, and Infants' Clothing and Accessories Merchant Wholesalers",
    	"42434": "Footwear Merchant Wholesalers",
    	"42441": "General Line Grocery Merchant Wholesalers",
    	"42442": "Packaged Frozen Food Merchant Wholesalers",
    	"42443": "Dairy Product (except Dried or Canned) Merchant Wholesalers",
    	"42444": "Poultry and Poultry Product Merchant Wholesalers",
    	"42445": "Confectionery Merchant Wholesalers",
    	"42446": "Fish and Seafood Merchant Wholesalers",
    	"42447": "Meat and Meat Product Merchant Wholesalers",
    	"42448": "Fresh Fruit and Vegetable Merchant Wholesalers",
    	"42449": "Other Grocery and Related Products Merchant Wholesalers",
    	"42451": "Grain and Field Bean Merchant Wholesalers",
    	"42452": "Livestock Merchant Wholesalers",
    	"42459": "Other Farm Product Raw Material Merchant Wholesalers",
    	"42461": "Plastics Materials and Basic Forms and Shapes Merchant Wholesalers",
    	"42469": "Other Chemical and Allied Products Merchant Wholesalers",
    	"42471": "Petroleum Bulk Stations and Terminals",
    	"42472": "Petroleum and Petroleum Products Merchant Wholesalers (except Bulk Stations and Terminals)",
    	"42481": "Beer and Ale Merchant Wholesalers",
    	"42482": "Wine and Distilled Alcoholic Beverage Merchant Wholesalers",
    	"42491": "Farm Supplies Merchant Wholesalers",
    	"42492": "Book, Periodical, and Newspaper Merchant Wholesalers",
    	"42493": "Flower, Nursery Stock, and Florists' Supplies Merchant Wholesalers",
    	"42494": "Tobacco and Tobacco Product Merchant Wholesalers",
    	"42495": "Paint, Varnish, and Supplies Merchant Wholesalers",
    	"42499": "Other Miscellaneous Nondurable Goods Merchant Wholesalers",
    	"42511": "Business to Business Electronic Markets",
    	"42512": "Wholesale Trade Agents and Brokers",
    	"44111": "New Car Dealers",
    	"44112": "Used Car Dealers",
    	"44121": "Recreational Vehicle Dealers",
    	"44122": "Motorcycle, Boat, and Other Motor Vehicle Dealers",
    	"44131": "Automotive Parts and Accessories Stores",
    	"44132": "Tire Dealers",
    	"44211": "Furniture Stores",
    	"44221": "Floor Covering Stores",
    	"44229": "Other Home Furnishings Stores",
    	"44311": "Appliance, Television, and Other Electronics Stores",
    	"44312": "Computer and Software Stores",
    	"44313": "Camera and Photographic Supplies Stores",
    	"44314": "Electronics and Appliance Stores",
    	"44411": "Home Centers",
    	"44412": "Paint and Wallpaper Stores",
    	"44413": "Hardware Stores",
    	"44419": "Other Building Material Dealers",
    	"44421": "Outdoor Power Equipment Stores",
    	"44422": "Nursery, Garden Center, and Farm Supply Stores",
    	"44511": "Supermarkets and Other Grocery (except Convenience) Stores",
    	"44512": "Convenience Stores",
    	"44521": "Meat Markets",
    	"44522": "Fish and Seafood Markets",
    	"44523": "Fruit and Vegetable Markets",
    	"44529": "Other Specialty Food Stores",
    	"44531": "Beer, Wine, and Liquor Stores",
    	"44611": "Pharmacies and Drug Stores",
    	"44612": "Cosmetics, Beauty Supplies, and Perfume Stores",
    	"44613": "Optical Goods Stores",
    	"44619": "Other Health and Personal Care Stores",
    	"44711": "Gasoline Stations with Convenience Stores",
    	"44719": "Other Gasoline Stations",
    	"44811": "Men's Clothing Stores",
    	"44812": "Women's Clothing Stores",
    	"44813": "Children's and Infants' Clothing Stores",
    	"44814": "Family Clothing Stores",
    	"44815": "Clothing Accessories Stores",
    	"44819": "Other Clothing Stores",
    	"44821": "Shoe Stores",
    	"44831": "Jewelry Stores",
    	"44832": "Luggage and Leather Goods Stores",
    	"45111": "Sporting Goods Stores",
    	"45112": "Hobby, Toy, and Game Stores",
    	"45113": "Sewing, Needlework, and Piece Goods Stores",
    	"45114": "Musical Instrument and Supplies Stores",
    	"45121": "Book Stores and News Dealers",
    	"45122": "Prerecorded Tape, Compact Disc, and Record Stores",
    	"45211": "Department Stores",
    	"45221": "Department Stores",
    	"45231": "General Merchandise Stores, including Warehouse Clubs and Supercenters",
    	"45291": "Warehouse Clubs and Supercenters",
    	"45299": "All Other General Merchandise Stores",
    	"45311": "Florists",
    	"45321": "Office Supplies and Stationery Stores",
    	"45322": "Gift, Novelty, and Souvenir Stores",
    	"45331": "Used Merchandise Stores",
    	"45391": "Pet and Pet Supplies Stores",
    	"45392": "Art Dealers",
    	"45393": "Manufactured (Mobile) Home Dealers",
    	"45399": "All Other Miscellaneous Store Retailers",
    	"45411": "Electronic Shopping and Mail-Order Houses",
    	"45421": "Vending Machine Operators",
    	"45431": "Fuel Dealers",
    	"45439": "Other Direct Selling Establishments",
    	"48111": "Scheduled Air Transportation",
    	"48121": "Nonscheduled Air Transportation",
    	"48211": "Rail Transportation",
    	"48311": "Deep Sea, Coastal, and Great Lakes Water Transportation",
    	"48321": "Inland Water Transportation",
    	"48411": "General Freight Trucking, Local",
    	"48412": "General Freight Trucking, Long-Distance",
    	"48421": "Used Household and Office Goods Moving",
    	"48422": "Specialized Freight (except Used Goods) Trucking, Local",
    	"48423": "Specialized Freight (except Used Goods) Trucking, Long-Distance",
    	"48511": "Urban Transit Systems",
    	"48521": "Interurban and Rural Bus Transportation",
    	"48531": "Taxi Service",
    	"48532": "Limousine Service",
    	"48541": "School and Employee Bus Transportation",
    	"48551": "Charter Bus Industry",
    	"48599": "Other Transit and Ground Passenger Transportation",
    	"48611": "Pipeline Transportation of Crude Oil",
    	"48621": "Pipeline Transportation of Natural Gas",
    	"48691": "Pipeline Transportation of Refined Petroleum Products",
    	"48699": "All Other Pipeline Transportation",
    	"48711": "Scenic and Sightseeing Transportation, Land",
    	"48721": "Scenic and Sightseeing Transportation, Water",
    	"48799": "Scenic and Sightseeing Transportation, Other",
    	"48811": "Airport Operations",
    	"48819": "Other Support Activities for Air Transportation",
    	"48821": "Support Activities for Rail Transportation",
    	"48831": "Port and Harbor Operations",
    	"48832": "Marine Cargo Handling",
    	"48833": "Navigational Services to Shipping",
    	"48839": "Other Support Activities for Water Transportation",
    	"48841": "Motor Vehicle Towing",
    	"48849": "Other Support Activities for Road Transportation",
    	"48851": "Freight Transportation Arrangement",
    	"48899": "Other Support Activities for Transportation",
    	"49111": "Postal Service",
    	"49211": "Couriers and Express Delivery Services",
    	"49221": "Local Messengers and Local Delivery",
    	"49311": "General Warehousing and Storage",
    	"49312": "Refrigerated Warehousing and Storage",
    	"49313": "Farm Product Warehousing and Storage",
    	"49319": "Other Warehousing and Storage",
    	"51111": "Newspaper Publishers",
    	"51112": "Periodical Publishers",
    	"51113": "Book Publishers",
    	"51114": "Directory and Mailing List Publishers",
    	"51119": "Other Publishers",
    	"51121": "Software Publishers",
    	"51211": "Motion Picture and Video Production",
    	"51212": "Motion Picture and Video Distribution",
    	"51213": "Motion Picture and Video Exhibition",
    	"51219": "Postproduction Services and Other Motion Picture and Video Industries",
    	"51221": "Record Production",
    	"51222": "Integrated Record Production/Distribution",
    	"51223": "Music Publishers",
    	"51224": "Sound Recording Studios",
    	"51225": "Record Production and Distribution",
    	"51229": "Other Sound Recording Industries",
    	"51311": "Radio Broadcasting",
    	"51312": "Television Broadcasting",
    	"51321": "Cable Networks",
    	"51322": "Cable and Other Program Distribution",
    	"51331": "Wired Telecommunications Carriers",
    	"51332": "Wireless Telecommunications Carriers (except Satellite)",
    	"51333": "Telecommunications Resellers",
    	"51334": "Satellite Telecommunications",
    	"51339": "Other Telecommunications",
    	"51411": "News Syndicates",
    	"51412": "Libraries and Archives",
    	"51419": "Other Information Services",
    	"51421": "Data Processing Services",
    	"51511": "Radio Broadcasting",
    	"51512": "Television Broadcasting",
    	"51521": "Cable and Other Subscription Programming",
    	"51611": "Internet Publishing and Broadcasting",
    	"51711": "Wired Telecommunications Carriers",
    	"51721": "Wireless Telecommunications Carriers (except Satellite)",
    	"51731": "Wired and Wireless Telecommunications Carriers",
    	"51741": "Satellite Telecommunications",
    	"51751": "Cable and Other Program Distribution",
    	"51791": "Other Telecommunications",
    	"51811": "Internet Service Providers and Web Search Portals",
    	"51821": "Data Processing, Hosting, and Related Services",
    	"51911": "News Syndicates",
    	"51912": "Libraries and Archives",
    	"51913": "Internet Publishing and Broadcasting and Web Search Portals",
    	"51919": "All Other Information Services",
    	"52111": "Monetary Authorities - Central Bank",
    	"52211": "Commercial Banking",
    	"52212": "Savings Institutions",
    	"52213": "Credit Unions",
    	"52219": "Other Depository Credit Intermediation",
    	"52221": "Credit Card Issuing",
    	"52222": "Sales Financing",
    	"52229": "Other Nondepository Credit Intermediation",
    	"52231": "Mortgage and Nonmortgage Loan Brokers",
    	"52232": "Financial Transactions Processing, Reserve, and Clearinghouse Activities",
    	"52239": "Other Activities Related to Credit Intermediation",
    	"52311": "Investment Banking and Securities Dealing",
    	"52312": "Securities Brokerage",
    	"52313": "Commodity Contracts Dealing",
    	"52314": "Commodity Contracts Brokerage",
    	"52321": "Securities and Commodity Exchanges",
    	"52391": "Miscellaneous Intermediation",
    	"52392": "Portfolio Management",
    	"52393": "Investment Advice",
    	"52399": "All Other Financial Investment Activities",
    	"52411": "Direct Life, Health, and Medical Insurance Carriers",
    	"52412": "Direct Insurance (except Life, Health, and Medical) Carriers",
    	"52413": "Reinsurance Carriers",
    	"52421": "Insurance Agencies and Brokerages",
    	"52429": "Other Insurance Related Activities",
    	"52511": "Pension Funds",
    	"52512": "Health and Welfare Funds",
    	"52519": "Other Insurance Funds",
    	"52591": "Open-End Investment Funds",
    	"52592": "Trusts, Estates, and Agency Accounts",
    	"52593": "Real Estate Investment Trusts",
    	"52599": "Other Financial Vehicles",
    	"53111": "Lessors of Residential Buildings and Dwellings",
    	"53112": "Lessors of Nonresidential Buildings (except Miniwarehouses)",
    	"53113": "Lessors of Miniwarehouses and Self-Storage Units",
    	"53119": "Lessors of Other Real Estate Property",
    	"53121": "Offices of Real Estate Agents and Brokers",
    	"53131": "Real Estate Property Managers",
    	"53132": "Offices of Real Estate Appraisers",
    	"53139": "Other Activities Related to Real Estate",
    	"53211": "Passenger Car Rental and Leasing",
    	"53212": "Truck, Utility Trailer, and RV (Recreational Vehicle) Rental and Leasing",
    	"53221": "Consumer Electronics and Appliances Rental",
    	"53222": "Formal Wear and Costume Rental",
    	"53223": "Video Tape and Disc Rental",
    	"53228": "Other Consummer Goods Rental",
    	"53229": "Other Consumer Goods Rental",
    	"53231": "General Rental Centers",
    	"53241": "Construction, Transportation, Mining, and Forestry Machinery and Equipment Rental and Leasing",
    	"53242": "Office Machinery and Equipment Rental and Leasing",
    	"53249": "Other Commercial and Industrial Machinery and Equipment Rental and Leasing",
    	"53311": "Lessors of Nonfinancial Intangible Assets (except Copyrighted Works)",
    	"54111": "Offices of Lawyers",
    	"54112": "Offices of Notaries",
    	"54119": "Other Legal Services",
    	"54121": "Accounting, Tax Preparation, Bookkeeping, and Payroll Services",
    	"54131": "Architectural Services",
    	"54132": "Landscape Architectural Services",
    	"54133": "Engineering Services",
    	"54134": "Drafting Services",
    	"54135": "Building Inspection Services",
    	"54136": "Geophysical Surveying and Mapping Services",
    	"54137": "Surveying and Mapping (except Geophysical) Services",
    	"54138": "Testing Laboratories",
    	"54141": "Interior Design Services",
    	"54142": "Industrial Design Services",
    	"54143": "Graphic Design Services",
    	"54149": "Other Specialized Design Services",
    	"54151": "Computer Systems Design and Related Services",
    	"54161": "Management Consulting Services",
    	"54162": "Environmental Consulting Services",
    	"54169": "Other Scientific and Technical Consulting Services",
    	"54171": "Research and Development in the Physical, Engineering, and Life Sciences",
    	"54172": "Research and Development in the Social Sciences and Humanities",
    	"54173": "Research and Development in the Social Sciences and Humanities",
    	"54181": "Advertising Agencies",
    	"54182": "Public Relations Agencies",
    	"54183": "Media Buying Agencies",
    	"54184": "Media Representatives",
    	"54185": "Outdoor Advertising",
    	"54186": "Direct Mail Advertising",
    	"54187": "Advertising Material Distribution Services",
    	"54189": "Other Services Related to Advertising",
    	"54191": "Marketing Research and Public Opinion Polling",
    	"54192": "Photographic Services",
    	"54193": "Translation and Interpretation Services",
    	"54194": "Veterinary Services",
    	"54199": "All Other Professional, Scientific, and Technical Services",
    	"55111": "Management of Companies and Enterprises",
    	"56111": "Office Administrative Services",
    	"56121": "Facilities Support Services",
    	"56131": "Employment Placement Agencies and Executive Search Services",
    	"56132": "Temporary Help Services",
    	"56133": "Professional Employer Organizations",
    	"56141": "Document Preparation Services",
    	"56142": "Telephone Call Centers",
    	"56143": "Business Service Centers",
    	"56144": "Collection Agencies",
    	"56145": "Credit Bureaus",
    	"56149": "Other Business Support Services",
    	"56151": "Travel Agencies",
    	"56152": "Tour Operators",
    	"56159": "Other Travel Arrangement and Reservation Services",
    	"56161": "Investigation, Guard, and Armored Car Services",
    	"56162": "Security Systems Services",
    	"56171": "Exterminating and Pest Control Services",
    	"56172": "Janitorial Services",
    	"56173": "Landscaping Services",
    	"56174": "Carpet and Upholstery Cleaning Services",
    	"56179": "Other Services to Buildings and Dwellings",
    	"56191": "Packaging and Labeling Services",
    	"56192": "Convention and Trade Show Organizers",
    	"56199": "All Other Support Services",
    	"56211": "Waste Collection",
    	"56221": "Waste Treatment and Disposal",
    	"56291": "Remediation Services",
    	"56292": "Materials Recovery Facilities",
    	"56299": "All Other Waste Management Services",
    	"61111": "Elementary and Secondary Schools",
    	"61121": "Junior Colleges",
    	"61131": "Colleges, Universities, and Professional Schools",
    	"61141": "Business and Secretarial Schools",
    	"61142": "Computer Training",
    	"61143": "Professional and Management Development Training",
    	"61151": "Technical and Trade Schools",
    	"61161": "Fine Arts Schools",
    	"61162": "Sports and Recreation Instruction",
    	"61163": "Language Schools",
    	"61169": "All Other Schools and Instruction",
    	"61171": "Educational Support Services",
    	"62111": "Offices of Physicians",
    	"62121": "Offices of Dentists",
    	"62131": "Offices of Chiropractors",
    	"62132": "Offices of Optometrists",
    	"62133": "Offices of Mental Health Practitioners (except Physicians)",
    	"62134": "Offices of Physical, Occupational and Speech Therapists, and Audiologists",
    	"62139": "Offices of All Other Health Practitioners",
    	"62141": "Family Planning Centers",
    	"62142": "Outpatient Mental Health and Substance Abuse Centers",
    	"62149": "Other Outpatient Care Centers",
    	"62151": "Medical and Diagnostic Laboratories",
    	"62161": "Home Health Care Services",
    	"62191": "Ambulance Services",
    	"62199": "All Other Ambulatory Health Care Services",
    	"62211": "General Medical and Surgical Hospitals",
    	"62221": "Psychiatric and Substance Abuse Hospitals",
    	"62231": "Specialty (except Psychiatric and Substance Abuse) Hospitals",
    	"62311": "Nursing Care Facilities (Skilled Nursing Facilities)",
    	"62321": "Residential Intellectual and Developmental Disability Facilities",
    	"62322": "Residential Mental Health and Substance Abuse Facilities",
    	"62331": "Continuing Care Retirement Communities and Assisted Living Facilities for the Elderly",
    	"62399": "Other Residential Care Facilities",
    	"62411": "Child and Youth Services",
    	"62412": "Services for the Elderly and Persons with Disabilities",
    	"62419": "Other Individual and Family Services",
    	"62421": "Community Food Services",
    	"62422": "Community Housing Services",
    	"62423": "Emergency and Other Relief Services",
    	"62431": "Vocational Rehabilitation Services",
    	"62441": "Child Day Care Services",
    	"71111": "Theater Companies and Dinner Theaters",
    	"71112": "Dance Companies",
    	"71113": "Musical Groups and Artists",
    	"71119": "Other Performing Arts Companies",
    	"71121": "Spectator Sports",
    	"71131": "Promoters of Performing Arts, Sports, and Similar Events with Facilities",
    	"71132": "Promoters of Performing Arts, Sports, and Similar Events without Facilities",
    	"71141": "Agents and Managers for Artists, Athletes, Entertainers, and Other Public Figures",
    	"71151": "Independent Artists, Writers, and Performers",
    	"71211": "Museums",
    	"71212": "Historical Sites",
    	"71213": "Zoos and Botanical Gardens",
    	"71219": "Nature Parks and Other Similar Institutions",
    	"71311": "Amusement and Theme Parks",
    	"71312": "Amusement Arcades",
    	"71321": "Casinos (except Casino Hotels)",
    	"71329": "Other Gambling Industries",
    	"71391": "Golf Courses and Country Clubs",
    	"71392": "Skiing Facilities",
    	"71393": "Marinas",
    	"71394": "Fitness and Recreational Sports Centers",
    	"71395": "Bowling Centers",
    	"71399": "All Other Amusement and Recreation Industries",
    	"72111": "Hotels (except Casino Hotels) and Motels",
    	"72112": "Casino Hotels",
    	"72119": "Other Traveler Accommodation",
    	"72121": "RV (Recreational Vehicle) Parks and Recreational Camps",
    	"72131": "Rooming and Boarding Houses, Dormitories, and Workers' Camps",
    	"72211": "Full-Service Restaurants",
    	"72221": "Limited-Service Eating Places",
    	"72231": "Food Service Contractors",
    	"72232": "Caterers",
    	"72233": "Mobile Food Services",
    	"72241": "Drinking Places (Alcoholic Beverages)",
    	"72251": "Restaurants and Other Eating Places",
    	"81111": "Automotive Mechanical and Electrical Repair and Maintenance",
    	"81112": "Automotive Body, Paint, Interior, and Glass Repair",
    	"81119": "Other Automotive Repair and Maintenance",
    	"81121": "Electronic and Precision Equipment Repair and Maintenance",
    	"81131": "Commercial and Industrial Machinery and Equipment (except Automotive and Electronic) Repair and Maintenance",
    	"81141": "Home and Garden Equipment and Appliance Repair and Maintenance",
    	"81142": "Reupholstery and Furniture Repair",
    	"81143": "Footwear and Leather Goods Repair",
    	"81149": "Other Personal and Household Goods Repair and Maintenance",
    	"81211": "Hair, Nail, and Skin Care Services",
    	"81219": "Other Personal Care Services",
    	"81221": "Funeral Homes and Funeral Services",
    	"81222": "Cemeteries and Crematories",
    	"81231": "Coin-Operated Laundries and Drycleaners",
    	"81232": "Drycleaning and Laundry Services (except Coin-Operated)",
    	"81233": "Linen and Uniform Supply",
    	"81239": "Other Laundry Services",
    	"81291": "Pet Care (except Veterinary) Services",
    	"81292": "Photofinishing",
    	"81293": "Parking Lots and Garages",
    	"81299": "All Other Personal Services",
    	"81311": "Religious Organizations",
    	"81321": "Grantmaking and Giving Services",
    	"81331": "Social Advocacy Organizations",
    	"81341": "Civic and Social Organizations",
    	"81391": "Business Associations",
    	"81392": "Professional Organizations",
    	"81393": "Labor Unions and Similar Labor Organizations",
    	"81394": "Political Organizations",
    	"81399": "Other Similar Organizations (except Business, Professional, Labor, and Political Organizations)",
    	"81411": "Private Households",
    	"92111": "Executive Offices",
    	"92112": "Legislative Bodies",
    	"92113": "Public Finance Activities",
    	"92114": "Executive and Legislative Offices, Combined",
    	"92115": "American Indian and Alaska Native Tribal Governments",
    	"92119": "Other General Government Support",
    	"92211": "Courts",
    	"92212": "Police Protection",
    	"92213": "Legal Counsel and Prosecution",
    	"92214": "Correctional Institutions",
    	"92215": "Parole Offices and Probation Offices",
    	"92216": "Fire Protection",
    	"92219": "Other Justice, Public Order, and Safety Activities",
    	"92311": "Administration of Education Programs",
    	"92312": "Administration of Public Health Programs",
    	"92313": "Administration of Human Resource Programs (except Education, Public Health, and Veterans' Affairs Programs)",
    	"92314": "Administration of Veterans' Affairs",
    	"92411": "Administration of Air and Water Resource and Solid Waste Management Programs",
    	"92412": "Administration of Conservation Programs",
    	"92511": "Administration of Housing Programs",
    	"92512": "Administration of Urban Planning and Community and Rural Development",
    	"92611": "Administration of General Economic Programs",
    	"92612": "Regulation and Administration of Transportation Programs",
    	"92613": "Regulation and Administration of Communications, Electric, Gas, and Other Utilities",
    	"92614": "Regulation of Agricultural Marketing and Commodities",
    	"92615": "Regulation, Licensing, and Inspection of Miscellaneous Commercial Sectors",
    	"92711": "Space Research and Technology",
    	"92811": "National Security",
    	"92812": "International Affairs",
    	"99999": "Unclassified Establishment",
    	"111191": "Oilseed and Grain Combination Farming",
    	"111199": "All Other Grain Farming",
    	"111211": "Potato Farming",
    	"111219": "Other Vegetable (except Potato) and Melon Farming",
    	"111331": "Apple Orchards",
    	"111332": "Grape Vineyards",
    	"111333": "Strawberry Farming",
    	"111334": "Berry (except Strawberry) Farming",
    	"111335": "Tree Nut Farming",
    	"111336": "Fruit and Tree Nut Combination Farming",
    	"111339": "Other Noncitrus Fruit Farming",
    	"111411": "Mushroom Production",
    	"111419": "Other Food Crops Grown Under Cover",
    	"111421": "Nursery and Tree Production",
    	"111422": "Floriculture Production",
    	"111991": "Sugar Beet Farming",
    	"111992": "Peanut Farming",
    	"111998": "All Other Miscellaneous Crop Farming",
    	"112111": "Beef Cattle Ranching and Farming",
    	"112112": "Cattle Feedlots",
    	"112511": "Finfish Farming and Fish Hatcheries",
    	"112512": "Shellfish Farming",
    	"112519": "Other Aquaculture",
    	"114111": "Finfish Fishing",
    	"114112": "Shellfish Fishing",
    	"114119": "Other Marine Fishing",
    	"115111": "Cotton Ginning",
    	"115112": "Soil Preparation, Planting, and Cultivating",
    	"115113": "Crop Harvesting, Primarily by Machine",
    	"115114": "Postharvest Crop Activities (except Cotton Ginning)",
    	"115115": "Farm Labor Contractors and Crew Leaders",
    	"115116": "Farm Management Services",
    	"211111": "Crude Petroleum and Natural Gas Extraction",
    	"211112": "Natural Gas Liquid Extraction",
    	"212111": "Bituminous Coal and Lignite Surface Mining",
    	"212112": "Bituminous Coal Underground Mining",
    	"212113": "Anthracite Mining",
    	"212221": "Gold Ore Mining",
    	"212222": "Silver Ore Mining",
    	"212231": "Lead Ore and Zinc Ore Mining",
    	"212234": "Copper Ore and Nickel Ore Mining",
    	"212291": "Uranium-Radium-Vanadium Ore Mining",
    	"212299": "All Other Metal Ore Mining",
    	"212311": "Dimension Stone Mining and Quarrying",
    	"212312": "Crushed and Broken Limestone Mining and Quarrying",
    	"212313": "Crushed and Broken Granite Mining and Quarrying",
    	"212319": "Other Crushed and Broken Stone Mining and Quarrying",
    	"212321": "Construction Sand and Gravel Mining",
    	"212322": "Industrial Sand Mining",
    	"212324": "Kaolin and Ball Clay Mining",
    	"212325": "Clay and Ceramic and Refractory Minerals Mining",
    	"212391": "Potash, Soda, and Borate Mineral Mining",
    	"212392": "Phosphate Rock Mining",
    	"212393": "Other Chemical and Fertilizer Mineral Mining",
    	"212399": "All Other Nonmetallic Mineral Mining",
    	"213111": "Drilling Oil and Gas Wells",
    	"213112": "Support Activities for Oil and Gas Operations",
    	"213113": "Support Activities for Coal Mining",
    	"213114": "Support Activities for Metal Mining",
    	"213115": "Support Activities for Nonmetallic Minerals (except Fuels) Mining",
    	"221111": "Hydroelectric Power Generation",
    	"221112": "Fossil Fuel Electric Power Generation",
    	"221113": "Nuclear Electric Power Generation",
    	"221114": "Solar Electric Power Generation",
    	"221115": "Wind Electric Power Generation",
    	"221116": "Geothermal Electric Power Generation",
    	"221117": "Biomass Electric Power Generation",
    	"221118": "Other Electric Power Generation",
    	"221119": "Other Electric Power Generation",
    	"221121": "Electric Bulk Power Transmission and Control",
    	"221122": "Electric Power Distribution",
    	"236115": "New Single-Family Housing Construction (except For-Sale Builders)",
    	"236116": "New Multifamily Housing Construction (except For-Sale Builders)",
    	"236117": "New Housing For-Sale Builders",
    	"236118": "Residential Remodelers",
    	"311111": "Dog and Cat Food Manufacturing",
    	"311119": "Other Animal Food Manufacturing",
    	"311211": "Flour Milling",
    	"311212": "Rice Milling",
    	"311213": "Malt Manufacturing",
    	"311221": "Wet Corn Milling",
    	"311222": "Soybean Processing",
    	"311223": "Other Oilseed Processing",
    	"311224": "Soybean and Other Oilseed Processing",
    	"311225": "Fats and Oils Refining and Blending",
    	"311311": "Sugarcane Mills",
    	"311312": "Cane Sugar Refining",
    	"311313": "Beet Sugar Manufacturing",
    	"311314": "Cane Sugar Manufacturing",
    	"311351": "Chocolate and Confectionery Manufacturing from Cacao Beans",
    	"311352": "Confectionery Manufacturing from Purchased Chocolate",
    	"311411": "Frozen Fruit, Juice, and Vegetable Manufacturing",
    	"311412": "Frozen Specialty Food Manufacturing",
    	"311421": "Fruit and Vegetable Canning",
    	"311422": "Specialty Canning",
    	"311423": "Dried and Dehydrated Food Manufacturing",
    	"311511": "Fluid Milk Manufacturing",
    	"311512": "Creamery Butter Manufacturing",
    	"311513": "Cheese Manufacturing",
    	"311514": "Dry, Condensed, and Evaporated Dairy Product Manufacturing",
    	"311611": "Animal (except Poultry) Slaughtering",
    	"311612": "Meat Processed from Carcasses",
    	"311613": "Rendering and Meat Byproduct Processing",
    	"311615": "Poultry Processing",
    	"311711": "Seafood Canning",
    	"311712": "Fresh and Frozen Seafood Processing",
    	"311811": "Retail Bakeries",
    	"311812": "Commercial Bakeries",
    	"311813": "Frozen Cakes, Pies, and Other Pastries Manufacturing",
    	"311821": "Cookie and Cracker Manufacturing",
    	"311822": "Flour Mixes and Dough Manufacturing from Purchased Flour",
    	"311823": "Dry Pasta Manufacturing",
    	"311824": "Dry Pasta, Dough, and Flour Mixes Manufacturing from Purchased Flour",
    	"311911": "Roasted Nuts and Peanut Butter Manufacturing",
    	"311919": "Other Snack Food Manufacturing",
    	"311941": "Mayonnaise, Dressing, and Other Prepared Sauce Manufacturing",
    	"311942": "Spice and Extract Manufacturing",
    	"311991": "Perishable Prepared Food Manufacturing",
    	"311999": "All Other Miscellaneous Food Manufacturing",
    	"312111": "Soft Drink Manufacturing",
    	"312112": "Bottled Water Manufacturing",
    	"312113": "Ice Manufacturing",
    	"312221": "Cigarette Manufacturing",
    	"312229": "Other Tobacco Product Manufacturing",
    	"313111": "Yarn Spinning Mills",
    	"313112": "Yarn Texturizing, Throwing, and Twisting Mills",
    	"313113": "Thread Mills",
    	"313221": "Narrow Fabric Mills",
    	"313222": "Schiffli Machine Embroidery",
    	"313241": "Weft Knit Fabric Mills",
    	"313249": "Other Knit Fabric and Lace Mills",
    	"313311": "Broadwoven Fabric Finishing Mills",
    	"313312": "Textile and Fabric Finishing (except Broadwoven Fabric) Mills",
    	"314121": "Curtain and Drapery Mills",
    	"314129": "Other Household Textile Product Mills",
    	"314911": "Textile Bag Mills",
    	"314912": "Canvas and Related Product Mills",
    	"314991": "Rope, Cordage, and Twine Mills",
    	"314992": "Tire Cord and Tire Fabric Mills",
    	"314994": "Rope, Cordage, Twine, Tire Cord, and Tire Fabric Mills",
    	"314999": "All Other Miscellaneous Textile Product Mills",
    	"315111": "Sheer Hosiery Mills",
    	"315119": "Other Hosiery and Sock Mills",
    	"315191": "Outerwear Knitting Mills",
    	"315192": "Underwear and Nightwear Knitting Mills",
    	"315211": "Men's and Boys' Cut and Sew Apparel Contractors",
    	"315212": "Women's, Girls', and Infants' Cut and Sew Apparel Contractors",
    	"315221": "Men's and Boys' Cut and Sew Underwear and Nightwear Manufacturing",
    	"315222": "Men's and Boys' Cut and Sew Suit, Coat, and Overcoat Manufacturing",
    	"315223": "Men's and Boys' Cut and Sew Shirt (except Work Shirt) Manufacturing",
    	"315224": "Men's and Boys' Cut and Sew Trouser, Slack, and Jean Manufacturing",
    	"315225": "Men's and Boys' Cut and Sew Work Clothing Manufacturing",
    	"315228": "Men's and Boys' Cut and Sew Other Outerwear Manufacturing",
    	"315231": "Women's and Girls' Cut and Sew Lingerie, Loungewear, and Nightwear Manufacturing",
    	"315232": "Women's and Girls' Cut and Sew Blouse and Shirt Manufacturing",
    	"315233": "Women's and Girls' Cut and Sew Dress Manufacturing",
    	"315234": "Women's and Girls' Cut and Sew Suit, Coat, Tailored Jacket, and Skirt Manufacturing",
    	"315238": "Women's and Girls' Cut and Sew Other Outerwear Manufacturing",
    	"315239": "Women's and Girls' Cut and Sew Other Outerwear Manufacturing",
    	"315291": "Infants' Cut and Sew Apparel Manufacturing",
    	"315292": "Fur and Leather Apparel Manufacturing",
    	"315299": "All Other Cut and Sew Apparel Manufacturing",
    	"315991": "Hat, Cap, and Millinery Manufacturing",
    	"315992": "Glove and Mitten Manufacturing",
    	"315993": "Men's and Boys' Neckwear Manufacturing",
    	"315999": "Other Apparel Accessories and Other Apparel Manufacturing",
    	"316211": "Rubber and Plastics Footwear Manufacturing",
    	"316212": "House Slipper Manufacturing",
    	"316213": "Men's Footwear (except Athletic) Manufacturing",
    	"316214": "Women's Footwear (except Athletic) Manufacturing",
    	"316219": "Other Footwear Manufacturing",
    	"316991": "Luggage Manufacturing",
    	"316992": "Women's Handbag and Purse Manufacturing",
    	"316993": "Personal Leather Good (except Women's Handbag and Purse) Manufacturing",
    	"316998": "All Other Leather Good and Allied Product Manufacturing",
    	"316999": "All Other Leather Good Manufacturing",
    	"321113": "Sawmills",
    	"321114": "Wood Preservation",
    	"321211": "Hardwood Veneer and Plywood Manufacturing",
    	"321212": "Softwood Veneer and Plywood Manufacturing",
    	"321213": "Engineered Wood Member (except Truss) Manufacturing",
    	"321214": "Truss Manufacturing",
    	"321219": "Reconstituted Wood Product Manufacturing",
    	"321911": "Wood Window and Door Manufacturing",
    	"321912": "Cut Stock, Resawing Lumber, and Planing",
    	"321918": "Other Millwork (including Flooring)",
    	"321991": "Manufactured Home (Mobile Home) Manufacturing",
    	"321992": "Prefabricated Wood Building Manufacturing",
    	"321999": "All Other Miscellaneous Wood Product Manufacturing",
    	"322121": "Paper (except Newsprint) Mills",
    	"322122": "Newsprint Mills",
    	"322211": "Corrugated and Solid Fiber Box Manufacturing",
    	"322212": "Folding Paperboard Box Manufacturing",
    	"322213": "Setup Paperboard Box Manufacturing",
    	"322214": "Fiber Can, Tube, Drum, and Similar Products Manufacturing",
    	"322215": "Nonfolding Sanitary Food Container Manufacturing",
    	"322219": "Other Paperboard Container Manufacturing",
    	"322221": "Coated and Laminated Packaging Paper and Plastics Film Manufacturing",
    	"322222": "Coated and Laminated Paper Manufacturing",
    	"322223": "Plastics, Foil, and Coated Paper Bag Manufacturing",
    	"322224": "Uncoated Paper and Multiwall Bag Manufacturing",
    	"322225": "Laminated Aluminum Foil Manufacturing for Flexible Packaging Uses",
    	"322226": "Surface-Coated Paperboard Manufacturing",
    	"322231": "Die-Cut Paper and Paperboard Office Supplies Manufacturing",
    	"322232": "Envelope Manufacturing",
    	"322233": "Stationery, Tablet, and Related Product Manufacturing",
    	"322291": "Sanitary Paper Product Manufacturing",
    	"322292": "Surface-Coated Paperboard Manufacturing",
    	"322298": "All Other Converted Paper Product Manufacturing",
    	"322299": "All Other Converted Paper Product Manufacturing",
    	"323110": "Commercial Lithographic Printing",
    	"323111": "Commercial Printing (except Screen and Books)",
    	"323112": "Commercial Flexographic Printing",
    	"323113": "Commercial Screen Printing",
    	"323114": "Quick Printing",
    	"323115": "Digital Printing",
    	"323116": "Manifold Business Forms Printing",
    	"323117": "Books Printing",
    	"323118": "Blankbook, Looseleaf Binders, and Devices Manufacturing",
    	"323119": "Other Commercial Printing",
    	"323121": "Tradebinding and Related Work",
    	"323122": "Prepress Services",
    	"324121": "Asphalt Paving Mixture and Block Manufacturing",
    	"324122": "Asphalt Shingle and Coating Materials Manufacturing",
    	"324191": "Petroleum Lubricating Oil and Grease Manufacturing",
    	"324199": "All Other Petroleum and Coal Products Manufacturing",
    	"325131": "Inorganic Dye and Pigment Manufacturing",
    	"325132": "Synthetic Organic Dye and Pigment Manufacturing",
    	"325181": "Alkalies and Chlorine Manufacturing",
    	"325182": "Carbon Black Manufacturing",
    	"325188": "All Other Basic Inorganic Chemical Manufacturing",
    	"325191": "Gum and Wood Chemical Manufacturing",
    	"325192": "Cyclic Crude and Intermediate Manufacturing",
    	"325193": "Ethyl Alcohol Manufacturing",
    	"325194": "Cyclic Crude, Intermediate, and Gum and Wood Chemical Manufacturing",
    	"325199": "All Other Basic Organic Chemical Manufacturing",
    	"325211": "Plastics Material and Resin Manufacturing",
    	"325212": "Synthetic Rubber Manufacturing",
    	"325221": "Cellulosic Organic Fiber Manufacturing",
    	"325222": "Noncellulosic Organic Fiber Manufacturing",
    	"325311": "Nitrogenous Fertilizer Manufacturing",
    	"325312": "Phosphatic Fertilizer Manufacturing",
    	"325314": "Fertilizer (Mixing Only) Manufacturing",
    	"325411": "Medicinal and Botanical Manufacturing",
    	"325412": "Pharmaceutical Preparation Manufacturing",
    	"325413": "In-Vitro Diagnostic Substance Manufacturing",
    	"325414": "Biological Product (except Diagnostic) Manufacturing",
    	"325611": "Soap and Other Detergent Manufacturing",
    	"325612": "Polish and Other Sanitation Good Manufacturing",
    	"325613": "Surface Active Agent Manufacturing",
    	"325991": "Custom Compounding of Purchased Resins",
    	"325992": "Photographic Film, Paper, Plate, and Chemical Manufacturing",
    	"325998": "All Other Miscellaneous Chemical Product and Preparation Manufacturing",
    	"326111": "Plastics Bag and Pouch Manufacturing",
    	"326112": "Plastics Packaging Film and Sheet (including Laminated) Manufacturing",
    	"326113": "Unlaminated Plastics Film and Sheet (except Packaging) Manufacturing",
    	"326121": "Unlaminated Plastics Profile Shape Manufacturing",
    	"326122": "Plastics Pipe and Pipe Fitting Manufacturing",
    	"326191": "Plastics Plumbing Fixture Manufacturing",
    	"326192": "Resilient Floor Covering Manufacturing",
    	"326199": "All Other Plastics Product Manufacturing",
    	"326211": "Tire Manufacturing (except Retreading)",
    	"326212": "Tire Retreading",
    	"326291": "Rubber Product Manufacturing for Mechanical Use",
    	"326299": "All Other Rubber Product Manufacturing",
    	"327111": "Vitreous China Plumbing Fixture and China and Earthenware Bathroom Accessories Manufacturing",
    	"327112": "Vitreous China, Fine Earthenware, and Other Pottery Product Manufacturing",
    	"327113": "Porcelain Electrical Supply Manufacturing",
    	"327121": "Brick and Structural Clay Tile Manufacturing",
    	"327122": "Ceramic Wall and Floor Tile Manufacturing",
    	"327123": "Other Structural Clay Product Manufacturing",
    	"327124": "Clay Refractory Manufacturing",
    	"327125": "Nonclay Refractory Manufacturing",
    	"327211": "Flat Glass Manufacturing",
    	"327212": "Other Pressed and Blown Glass and Glassware Manufacturing",
    	"327213": "Glass Container Manufacturing",
    	"327215": "Glass Product Manufacturing Made of Purchased Glass",
    	"327331": "Concrete Block and Brick Manufacturing",
    	"327332": "Concrete Pipe Manufacturing",
    	"327991": "Cut Stone and Stone Product Manufacturing",
    	"327992": "Ground or Treated Mineral and Earth Manufacturing",
    	"327993": "Mineral Wool Manufacturing",
    	"327999": "All Other Miscellaneous Nonmetallic Mineral Product Manufacturing",
    	"331111": "Iron and Steel Mills",
    	"331112": "Electrometallurgical Ferroalloy Product Manufacturing",
    	"331221": "Rolled Steel Shape Manufacturing",
    	"331222": "Steel Wire Drawing",
    	"331311": "Alumina Refining",
    	"331312": "Primary Aluminum Production",
    	"331313": "Alumina Refining and Primary Aluminum Production",
    	"331314": "Secondary Smelting and Alloying of Aluminum",
    	"331315": "Aluminum Sheet, Plate, and Foil Manufacturing",
    	"331316": "Aluminum Extruded Product Manufacturing",
    	"331318": "Other Aluminum Rolling, Drawing, and Extruding",
    	"331319": "Other Aluminum Rolling and Drawing",
    	"331411": "Primary Smelting and Refining of Copper",
    	"331419": "Primary Smelting and Refining of Nonferrous Metal (except Copper and Aluminum)",
    	"331421": "Copper Rolling, Drawing, and Extruding",
    	"331422": "Copper Wire (except Mechanical) Drawing",
    	"331423": "Secondary Smelting, Refining, and Alloying of Copper",
    	"331491": "Nonferrous Metal (except Copper and Aluminum) Rolling, Drawing, and Extruding",
    	"331492": "Secondary Smelting, Refining, and Alloying of Nonferrous Metal (except Copper and Aluminum)",
    	"331511": "Iron Foundries",
    	"331512": "Steel Investment Foundries",
    	"331513": "Steel Foundries (except Investment)",
    	"331521": "Aluminum Die-Casting Foundries",
    	"331522": "Nonferrous (except Aluminum) Die-Casting Foundries",
    	"331523": "Nonferrous Metal Die-Casting Foundries",
    	"331524": "Aluminum Foundries (except Die-Casting)",
    	"331525": "Copper Foundries (except Die-Casting)",
    	"331528": "Other Nonferrous Foundries (except Die-Casting)",
    	"331529": "Other Nonferrous Metal Foundries (except Die-Casting)",
    	"332111": "Iron and Steel Forging",
    	"332112": "Nonferrous Forging",
    	"332114": "Custom Roll Forming",
    	"332115": "Crown and Closure Manufacturing",
    	"332116": "Metal Stamping",
    	"332117": "Powder Metallurgy Part Manufacturing",
    	"332119": "Metal Crown, Closure, and Other Metal Stamping (except Automotive)",
    	"332211": "Cutlery and Flatware (except Precious) Manufacturing",
    	"332212": "Hand and Edge Tool Manufacturing",
    	"332213": "Saw Blade and Handsaw Manufacturing",
    	"332214": "Kitchen Utensil, Pot, and Pan Manufacturing",
    	"332215": "Metal Kitchen Cookware, Utensil, Cutlery, and Flatware (except Precious) Manufacturing",
    	"332216": "Saw Blade and Handtool Manufacturing",
    	"332311": "Prefabricated Metal Building and Component Manufacturing",
    	"332312": "Fabricated Structural Metal Manufacturing",
    	"332313": "Plate Work Manufacturing",
    	"332321": "Metal Window and Door Manufacturing",
    	"332322": "Sheet Metal Work Manufacturing",
    	"332323": "Ornamental and Architectural Metal Work Manufacturing",
    	"332431": "Metal Can Manufacturing",
    	"332439": "Other Metal Container Manufacturing",
    	"332611": "Spring (Heavy Gauge) Manufacturing",
    	"332612": "Spring (Light Gauge) Manufacturing",
    	"332613": "Spring Manufacturing",
    	"332618": "Other Fabricated Wire Product Manufacturing",
    	"332721": "Precision Turned Product Manufacturing",
    	"332722": "Bolt, Nut, Screw, Rivet, and Washer Manufacturing",
    	"332811": "Metal Heat Treating",
    	"332812": "Metal Coating, Engraving (except Jewelry and Silverware), and Allied Services to Manufacturers",
    	"332813": "Electroplating, Plating, Polishing, Anodizing, and Coloring",
    	"332911": "Industrial Valve Manufacturing",
    	"332912": "Fluid Power Valve and Hose Fitting Manufacturing",
    	"332913": "Plumbing Fixture Fitting and Trim Manufacturing",
    	"332919": "Other Metal Valve and Pipe Fitting Manufacturing",
    	"332991": "Ball and Roller Bearing Manufacturing",
    	"332992": "Small Arms Ammunition Manufacturing",
    	"332993": "Ammunition (except Small Arms) Manufacturing",
    	"332994": "Small Arms, Ordnance, and Ordnance Accessories Manufacturing",
    	"332995": "Other Ordnance and Accessories Manufacturing",
    	"332996": "Fabricated Pipe and Pipe Fitting Manufacturing",
    	"332997": "Industrial Pattern Manufacturing",
    	"332998": "Enameled Iron and Metal Sanitary Ware Manufacturing",
    	"332999": "All Other Miscellaneous Fabricated Metal Product Manufacturing",
    	"333111": "Farm Machinery and Equipment Manufacturing",
    	"333112": "Lawn and Garden Tractor and Home Lawn and Garden Equipment Manufacturing",
    	"333131": "Mining Machinery and Equipment Manufacturing",
    	"333132": "Oil and Gas Field Machinery and Equipment Manufacturing",
    	"333241": "Food Product Machinery Manufacturing",
    	"333242": "Semiconductor Machinery Manufacturing",
    	"333243": "Sawmill, Woodworking, and Paper Machinery Manufacturing",
    	"333244": "Printing Machinery and Equipment Manufacturing",
    	"333249": "Other Industrial Machinery Manufacturing",
    	"333291": "Paper Industry Machinery Manufacturing",
    	"333292": "Textile Machinery Manufacturing",
    	"333293": "Printing Machinery and Equipment Manufacturing",
    	"333294": "Food Product Machinery Manufacturing",
    	"333295": "Semiconductor Machinery Manufacturing",
    	"333298": "All Other Industrial Machinery Manufacturing",
    	"333311": "Automatic Vending Machine Manufacturing",
    	"333312": "Commercial Laundry, Drycleaning, and Pressing Machine Manufacturing",
    	"333313": "Office Machinery Manufacturing",
    	"333314": "Optical Instrument and Lens Manufacturing",
    	"333315": "Photographic and Photocopying Equipment Manufacturing",
    	"333316": "Photographic and Photocopying Equipment Manufacturing",
    	"333318": "Other Commercial and Service Industry Machinery Manufacturing",
    	"333319": "Other Commercial and Service Industry Machinery Manufacturing",
    	"333411": "Air Purification Equipment Manufacturing",
    	"333412": "Industrial and Commercial Fan and Blower Manufacturing",
    	"333413": "Industrial and Commercial Fan and Blower and Air Purification Equipment Manufacturing",
    	"333414": "Heating Equipment (except Warm Air Furnaces) Manufacturing",
    	"333415": "Air-Conditioning and Warm Air Heating Equipment and Commercial and Industrial Refrigeration Equipment Manufacturing",
    	"333511": "Industrial Mold Manufacturing",
    	"333512": "Machine Tool (Metal Cutting Types) Manufacturing",
    	"333513": "Machine Tool (Metal Forming Types) Manufacturing",
    	"333514": "Special Die and Tool, Die Set, Jig, and Fixture Manufacturing",
    	"333515": "Cutting Tool and Machine Tool Accessory Manufacturing",
    	"333516": "Rolling Mill Machinery and Equipment Manufacturing",
    	"333517": "Machine Tool Manufacturing",
    	"333518": "Other Metalworking Machinery Manufacturing",
    	"333519": "Rolling Mill and Other Metalworking Machinery Manufacturing",
    	"333611": "Turbine and Turbine Generator Set Units Manufacturing",
    	"333612": "Speed Changer, Industrial High-Speed Drive, and Gear Manufacturing",
    	"333613": "Mechanical Power Transmission Equipment Manufacturing",
    	"333618": "Other Engine Equipment Manufacturing",
    	"333911": "Pump and Pumping Equipment Manufacturing",
    	"333912": "Air and Gas Compressor Manufacturing",
    	"333913": "Measuring and Dispensing Pump Manufacturing",
    	"333914": "Measuring, Dispensing, and Other Pumping Equipment Manufacturing",
    	"333921": "Elevator and Moving Stairway Manufacturing",
    	"333922": "Conveyor and Conveying Equipment Manufacturing",
    	"333923": "Overhead Traveling Crane, Hoist, and Monorail System Manufacturing",
    	"333924": "Industrial Truck, Tractor, Trailer, and Stacker Machinery Manufacturing",
    	"333991": "Power-Driven Handtool Manufacturing",
    	"333992": "Welding and Soldering Equipment Manufacturing",
    	"333993": "Packaging Machinery Manufacturing",
    	"333994": "Industrial Process Furnace and Oven Manufacturing",
    	"333995": "Fluid Power Cylinder and Actuator Manufacturing",
    	"333996": "Fluid Power Pump and Motor Manufacturing",
    	"333997": "Scale and Balance Manufacturing",
    	"333999": "All Other Miscellaneous General Purpose Machinery Manufacturing",
    	"334111": "Electronic Computer Manufacturing",
    	"334112": "Computer Storage Device Manufacturing",
    	"334113": "Computer Terminal Manufacturing",
    	"334118": "Computer Terminal and Other Computer Peripheral Equipment Manufacturing",
    	"334119": "Other Computer Peripheral Equipment Manufacturing",
    	"334411": "Electron Tube Manufacturing",
    	"334412": "Bare Printed Circuit Board Manufacturing",
    	"334413": "Semiconductor and Related Device Manufacturing",
    	"334414": "Electronic Capacitor Manufacturing",
    	"334415": "Electronic Resistor Manufacturing",
    	"334416": "Capacitor, Resistor, Coil, Transformer, and Other Inductor Manufacturing",
    	"334417": "Electronic Connector Manufacturing",
    	"334418": "Printed Circuit Assembly (Electronic Assembly) Manufacturing",
    	"334419": "Other Electronic Component Manufacturing",
    	"334510": "Electromedical and Electrotherapeutic Apparatus Manufacturing",
    	"334511": "Search, Detection, Navigation, Guidance, Aeronautical, and Nautical System and Instrument Manufacturing",
    	"334512": "Automatic Environmental Control Manufacturing for Residential, Commercial, and Appliance Use",
    	"334513": "Instruments and Related Products Manufacturing for Measuring, Displaying, and Controlling Industrial Process Variables",
    	"334514": "Totalizing Fluid Meter and Counting Device Manufacturing",
    	"334515": "Instrument Manufacturing for Measuring and Testing Electricity and Electrical Signals",
    	"334516": "Analytical Laboratory Instrument Manufacturing",
    	"334517": "Irradiation Apparatus Manufacturing",
    	"334518": "Watch, Clock, and Part Manufacturing",
    	"334519": "Other Measuring and Controlling Device Manufacturing",
    	"334611": "Software Reproducing",
    	"334612": "Prerecorded Compact Disc (except Software), Tape, and Record Reproducing",
    	"334613": "Blank Magnetic and Optical Recording Media Manufacturing",
    	"334614": "Software and Other Prerecorded Compact Disc, Tape, and Record Reproducing",
    	"335121": "Residential Electric Lighting Fixture Manufacturing",
    	"335122": "Commercial, Industrial, and Institutional Electric Lighting Fixture Manufacturing",
    	"335129": "Other Lighting Equipment Manufacturing",
    	"335211": "Electric Housewares and Household Fan Manufacturing",
    	"335212": "Household Vacuum Cleaner Manufacturing",
    	"335221": "Household Cooking Appliance Manufacturing",
    	"335222": "Household Refrigerator and Home Freezer Manufacturing",
    	"335224": "Household Laundry Equipment Manufacturing",
    	"335228": "Other Major Household Appliance Manufacturing",
    	"335311": "Power, Distribution, and Specialty Transformer Manufacturing",
    	"335312": "Motor and Generator Manufacturing",
    	"335313": "Switchgear and Switchboard Apparatus Manufacturing",
    	"335314": "Relay and Industrial Control Manufacturing",
    	"335911": "Storage Battery Manufacturing",
    	"335912": "Primary Battery Manufacturing",
    	"335921": "Fiber Optic Cable Manufacturing",
    	"335929": "Other Communication and Energy Wire Manufacturing",
    	"335931": "Current-Carrying Wiring Device Manufacturing",
    	"335932": "Noncurrent-Carrying Wiring Device Manufacturing",
    	"335991": "Carbon and Graphite Product Manufacturing",
    	"335999": "All Other Miscellaneous Electrical Equipment and Component Manufacturing",
    	"336111": "Automobile Manufacturing",
    	"336112": "Light Truck and Utility Vehicle Manufacturing",
    	"336211": "Motor Vehicle Body Manufacturing",
    	"336212": "Truck Trailer Manufacturing",
    	"336213": "Motor Home Manufacturing",
    	"336214": "Travel Trailer and Camper Manufacturing",
    	"336311": "Carburetor, Piston, Piston Ring, and Valve Manufacturing",
    	"336312": "Gasoline Engine and Engine Parts Manufacturing",
    	"336321": "Vehicular Lighting Equipment Manufacturing",
    	"336322": "Other Motor Vehicle Electrical and Electronic Equipment Manufacturing",
    	"336391": "Motor Vehicle Air-Conditioning Manufacturing",
    	"336399": "All Other Motor Vehicle Parts Manufacturing",
    	"336411": "Aircraft Manufacturing",
    	"336412": "Aircraft Engine and Engine Parts Manufacturing",
    	"336413": "Other Aircraft Parts and Auxiliary Equipment Manufacturing",
    	"336414": "Guided Missile and Space Vehicle Manufacturing",
    	"336415": "Guided Missile and Space Vehicle Propulsion Unit and Propulsion Unit Parts Manufacturing",
    	"336419": "Other Guided Missile and Space Vehicle Parts and Auxiliary Equipment Manufacturing",
    	"336611": "Ship Building and Repairing",
    	"336612": "Boat Building",
    	"336991": "Motorcycle, Bicycle, and Parts Manufacturing",
    	"336992": "Military Armored Vehicle, Tank, and Tank Component Manufacturing",
    	"336999": "All Other Transportation Equipment Manufacturing",
    	"337121": "Upholstered Household Furniture Manufacturing",
    	"337122": "Nonupholstered Wood Household Furniture Manufacturing",
    	"337124": "Metal Household Furniture Manufacturing",
    	"337125": "Household Furniture (except Wood and Metal) Manufacturing",
    	"337127": "Institutional Furniture Manufacturing",
    	"337129": "Wood Television, Radio, and Sewing Machine Cabinet Manufacturing",
    	"337211": "Wood Office Furniture Manufacturing",
    	"337212": "Custom Architectural Woodwork and Millwork Manufacturing",
    	"337214": "Office Furniture (except Wood) Manufacturing",
    	"337215": "Showcase, Partition, Shelving, and Locker Manufacturing",
    	"339111": "Laboratory Apparatus and Furniture Manufacturing",
    	"339112": "Surgical and Medical Instrument Manufacturing",
    	"339113": "Surgical Appliance and Supplies Manufacturing",
    	"339114": "Dental Equipment and Supplies Manufacturing",
    	"339115": "Ophthalmic Goods Manufacturing",
    	"339116": "Dental Laboratories",
    	"339911": "Jewelry (except Costume) Manufacturing",
    	"339912": "Silverware and Hollowware Manufacturing",
    	"339913": "Jewelers' Material and Lapidary Work Manufacturing",
    	"339914": "Costume Jewelry and Novelty Manufacturing",
    	"339931": "Doll and Stuffed Toy Manufacturing",
    	"339932": "Game, Toy, and Children's Vehicle Manufacturing",
    	"339941": "Pen and Mechanical Pencil Manufacturing",
    	"339942": "Lead Pencil and Art Good Manufacturing",
    	"339943": "Marking Device Manufacturing",
    	"339944": "Carbon Paper and Inked Ribbon Manufacturing",
    	"339991": "Gasket, Packing, and Sealing Device Manufacturing",
    	"339992": "Musical Instrument Manufacturing",
    	"339993": "Fastener, Button, Needle, and Pin Manufacturing",
    	"339994": "Broom, Brush, and Mop Manufacturing",
    	"339995": "Burial Casket Manufacturing",
    	"339999": "All Other Miscellaneous Manufacturing",
    	"441221": "Motorcycle Dealers",
    	"441222": "Boat Dealers",
    	"441228": "Motorcycle, ATV, and All Other Motor Vehicle Dealers",
    	"441229": "All Other Motor Vehicle Dealers",
    	"442291": "Window Treatment Stores",
    	"442299": "All Other Home Furnishings Stores",
    	"443111": "Household Appliance Stores",
    	"443112": "Radio, Television, and Other Electronics Stores",
    	"443141": "Household Appliance Stores",
    	"443142": "Electronics Stores",
    	"445291": "Baked Goods Stores",
    	"445292": "Confectionery and Nut Stores",
    	"445299": "All Other Specialty Food Stores",
    	"446191": "Food (Health) Supplement Stores",
    	"446199": "All Other Health and Personal Care Stores",
    	"451211": "Book Stores",
    	"451212": "News Dealers and Newsstands",
    	"452111": "Department Stores (except Discount Department Stores)",
    	"452112": "Discount Department Stores",
    	"452311": "Warehouse Clubs and Supercenters",
    	"452319": "All Other General Merchandise Stores",
    	"453991": "Tobacco Stores",
    	"453998": "All Other Miscellaneous Store Retailers (except Tobacco Stores)",
    	"454111": "Electronic Shopping",
    	"454112": "Electronic Auctions",
    	"454113": "Mail-Order Houses",
    	"454311": "Heating Oil Dealers",
    	"454312": "Liquefied Petroleum Gas (Bottled Gas) Dealers",
    	"454319": "Other Fuel Dealers",
    	"481111": "Scheduled Passenger Air Transportation",
    	"481112": "Scheduled Freight Air Transportation",
    	"481211": "Nonscheduled Chartered Passenger Air Transportation",
    	"481212": "Nonscheduled Chartered Freight Air Transportation",
    	"481219": "Other Nonscheduled Air Transportation",
    	"482111": "Line-Haul Railroads",
    	"482112": "Short Line Railroads",
    	"483111": "Deep Sea Freight Transportation",
    	"483112": "Deep Sea Passenger Transportation",
    	"483113": "Coastal and Great Lakes Freight Transportation",
    	"483114": "Coastal and Great Lakes Passenger Transportation",
    	"483211": "Inland Water Freight Transportation",
    	"483212": "Inland Water Passenger Transportation",
    	"484121": "General Freight Trucking, Long-Distance, Truckload",
    	"484122": "General Freight Trucking, Long-Distance, Less Than Truckload",
    	"485111": "Mixed Mode Transit Systems",
    	"485112": "Commuter Rail Systems",
    	"485113": "Bus and Other Motor Vehicle Transit Systems",
    	"485119": "Other Urban Transit Systems",
    	"485991": "Special Needs Transportation",
    	"485999": "All Other Transit and Ground Passenger Transportation",
    	"488111": "Air Traffic Control",
    	"488119": "Other Airport Operations",
    	"488991": "Packing and Crating",
    	"488999": "All Other Support Activities for Transportation",
    	"511191": "Greeting Card Publishers",
    	"511199": "All Other Publishers",
    	"512131": "Motion Picture Theaters (except Drive-Ins)",
    	"512132": "Drive-In Motion Picture Theaters",
    	"512191": "Teleproduction and Other Postproduction Services",
    	"512199": "Other Motion Picture and Video Industries",
    	"513111": "Radio Networks",
    	"513112": "Radio Stations",
    	"513321": "Paging",
    	"513322": "Cellular and Other Wireless Telecommunications",
    	"514191": "On-line Information Services",
    	"514199": "All Other Information Services",
    	"515111": "Radio Networks",
    	"515112": "Radio Stations",
    	"517211": "Paging",
    	"517212": "Cellular and Other Wireless Telecommunications",
    	"517311": "Wired Telecommunications Carriers",
    	"517312": "Wireless Telecommunications Carriers (except Satellite)",
    	"517911": "Telecommunications Resellers",
    	"517919": "All Other Telecommunications",
    	"518111": "Internet Service Providers",
    	"518112": "Web Search Portals",
    	"522291": "Consumer Lending",
    	"522292": "Real Estate Credit",
    	"522293": "International Trade Financing",
    	"522294": "Secondary Market Financing",
    	"522298": "All Other Nondepository Credit Intermediation",
    	"523991": "Trust, Fiduciary, and Custody Activities",
    	"523999": "Miscellaneous Financial Investment Activities",
    	"524113": "Direct Life Insurance Carriers",
    	"524114": "Direct Health and Medical Insurance Carriers",
    	"524126": "Direct Property and Casualty Insurance Carriers",
    	"524127": "Direct Title Insurance Carriers",
    	"524128": "Other Direct Insurance (except Life, Health, and Medical) Carriers",
    	"524291": "Claims Adjusting",
    	"524292": "Third Party Administration of Insurance and Pension Funds",
    	"524298": "All Other Insurance Related Activities",
    	"531311": "Residential Property Managers",
    	"531312": "Nonresidential Property Managers",
    	"532111": "Passenger Car Rental",
    	"532112": "Passenger Car Leasing",
    	"532281": "Formal Wear and Costume Rental",
    	"532282": "Video Tape and Disc Rental",
    	"532283": "Home Health Equipment Rental",
    	"532284": "Recreational Goods Rental",
    	"532289": "All Other Consumer Goods Rental",
    	"532291": "Home Health Equipment Rental",
    	"532292": "Recreational Goods Rental",
    	"532299": "All Other Consumer Goods Rental",
    	"532411": "Commercial Air, Rail, and Water Transportation Equipment Rental and Leasing",
    	"532412": "Construction, Mining, and Forestry Machinery and Equipment Rental and Leasing",
    	"541191": "Title Abstract and Settlement Offices",
    	"541199": "All Other Legal Services",
    	"541211": "Offices of Certified Public Accountants",
    	"541213": "Tax Preparation Services",
    	"541214": "Payroll Services",
    	"541219": "Other Accounting Services",
    	"541511": "Custom Computer Programming Services",
    	"541512": "Computer Systems Design Services",
    	"541513": "Computer Facilities Management Services",
    	"541519": "Other Computer Related Services",
    	"541611": "Administrative Management and General Management Consulting Services",
    	"541612": "Human Resources Consulting Services",
    	"541613": "Marketing Consulting Services",
    	"541614": "Process, Physical Distribution, and Logistics Consulting Services",
    	"541618": "Other Management Consulting Services",
    	"541711": "Research and Development in Biotechnology",
    	"541712": "Research and Development in the Physical, Engineering, and Life Sciences (except Biotechnology)",
    	"541713": "Research and Development in Nanotechnology",
    	"541714": "Research and Development in Biotechnology (except Nanobiotechnology)",
    	"541715": "Research and Development in the Physical, Engineering, and Life Sciences (except Nanotechnology and Biotechnology)",
    	"541921": "Photography Studios, Portrait",
    	"541922": "Commercial Photography",
    	"551111": "Offices of Bank Holding Companies",
    	"551112": "Offices of Other Holding Companies",
    	"551114": "Corporate, Subsidiary, and Regional Managing Offices",
    	"561311": "Employment Placement Agencies",
    	"561312": "Executive Search Services",
    	"561421": "Telephone Answering Services",
    	"561422": "Telemarketing Bureaus and Other Contact Centers",
    	"561431": "Private Mail Centers",
    	"561439": "Other Business Service Centers (including Copy Shops)",
    	"561491": "Repossession Services",
    	"561492": "Court Reporting and Stenotype Services",
    	"561499": "All Other Business Support Services",
    	"561591": "Convention and Visitors Bureaus",
    	"561599": "All Other Travel Arrangement and Reservation Services",
    	"561611": "Investigation Services",
    	"561612": "Security Guards and Patrol Services",
    	"561613": "Armored Car Services",
    	"561621": "Security Systems Services (except Locksmiths)",
    	"561622": "Locksmiths",
    	"562111": "Solid Waste Collection",
    	"562112": "Hazardous Waste Collection",
    	"562119": "Other Waste Collection",
    	"562211": "Hazardous Waste Treatment and Disposal",
    	"562212": "Solid Waste Landfill",
    	"562213": "Solid Waste Combustors and Incinerators",
    	"562219": "Other Nonhazardous Waste Treatment and Disposal",
    	"562991": "Septic Tank and Related Services",
    	"562998": "All Other Miscellaneous Waste Management Services",
    	"611511": "Cosmetology and Barber Schools",
    	"611512": "Flight Training",
    	"611513": "Apprenticeship Training",
    	"611519": "Other Technical and Trade Schools",
    	"611691": "Exam Preparation and Tutoring",
    	"611692": "Automobile Driving Schools",
    	"611699": "All Other Miscellaneous Schools and Instruction",
    	"621111": "Offices of Physicians (except Mental Health Specialists)",
    	"621112": "Offices of Physicians, Mental Health Specialists",
    	"621391": "Offices of Podiatrists",
    	"621399": "Offices of All Other Miscellaneous Health Practitioners",
    	"621491": "HMO Medical Centers",
    	"621492": "Kidney Dialysis Centers",
    	"621493": "Freestanding Ambulatory Surgical and Emergency Centers",
    	"621498": "All Other Outpatient Care Centers",
    	"621511": "Medical Laboratories",
    	"621512": "Diagnostic Imaging Centers",
    	"621991": "Blood and Organ Banks",
    	"621999": "All Other Miscellaneous Ambulatory Health Care Services",
    	"623311": "Continuing Care Retirement Communities",
    	"623312": "Assisted Living Facilities for the Elderly",
    	"624221": "Temporary Shelters",
    	"624229": "Other Community Housing Services",
    	"711211": "Sports Teams and Clubs",
    	"711212": "Racetracks",
    	"711219": "Other Spectator Sports",
    	"721191": "Bed-and-Breakfast Inns",
    	"721199": "All Other Traveler Accommodation",
    	"721211": "RV (Recreational Vehicle) Parks and Campgrounds",
    	"721214": "Recreational and Vacation Camps (except Campgrounds)",
    	"722211": "Limited-Service Restaurants",
    	"722212": "Cafeterias",
    	"722213": "Snack and Nonalcoholic Beverage Bars",
    	"722511": "Full-Service Restaurants",
    	"722513": "Limited-Service Restaurants",
    	"722514": "Cafeterias, Grill Buffets, and Buffets",
    	"722515": "Snack and Nonalcoholic Beverage Bars",
    	"811111": "General Automotive Repair",
    	"811112": "Automotive Exhaust System Repair",
    	"811113": "Automotive Transmission Repair",
    	"811118": "Other Automotive Mechanical and Electrical Repair and Maintenance",
    	"811121": "Automotive Body, Paint, and Interior Repair and Maintenance",
    	"811122": "Automotive Glass Replacement Shops",
    	"811191": "Automotive Oil Change and Lubrication Shops",
    	"811192": "Car Washes",
    	"811198": "All Other Automotive Repair and Maintenance",
    	"811211": "Consumer Electronics Repair and Maintenance",
    	"811212": "Computer and Office Machine Repair and Maintenance",
    	"811213": "Communication Equipment Repair and Maintenance",
    	"811219": "Other Electronic and Precision Equipment Repair and Maintenance",
    	"811411": "Home and Garden Equipment Repair and Maintenance",
    	"811412": "Appliance Repair and Maintenance",
    	"812111": "Barber Shops",
    	"812112": "Beauty Salons",
    	"812113": "Nail Salons",
    	"812191": "Diet and Weight Reducing Centers",
    	"812199": "Other Personal Care Services",
    	"812321": "Laundries, Family and Commercial",
    	"812322": "Drycleaning Plants",
    	"812331": "Linen Supply",
    	"812332": "Industrial Launderers",
    	"812391": "Garment Pressing, and Agents for Laundries",
    	"812399": "All Other Laundry Services",
    	"812921": "Photofinishing Laboratories (except One-Hour)",
    	"812922": "One-Hour Photofinishing",
    	"813211": "Grantmaking Foundations",
    	"813212": "Voluntary Health Organizations",
    	"813219": "Other Grantmaking and Giving Services",
    	"813311": "Human Rights Organizations",
    	"813312": "Environment, Conservation and Wildlife Organizations",
    	"813319": "Other Social Advocacy Organizations",
    	"31-33": "Manufacturing",
    	"44-45": "Retail Trade",
    	"48-49": "Transportation"
    };
    var DeregistrationReasonCode = {
    	"01": "Source reduced inventory of all regulated substances below TQs",
    	"02": "Source no longer uses any regulated substance",
    	"03": "Source terminated operations",
    	"04": "Other"
    };
    var RMPSubmissionReasonCode = {
    	C01: "Clerical error corrected",
    	C02: "Additional information supplied",
    	C03: "Minor administrative change",
    	C04: "Notification of facility ownership change",
    	C05: "New accident history information",
    	C06: "Change in emergency contact information",
    	C07: "New data element required by EPA",
    	C08: "Optional data element requested by EPA",
    	C09: "Removed OCA description from executive summary",
    	R01: "Newly regulated substance listed by EPA (40 CFR 68.190(b)(2))",
    	R02: "Newly regulated substance above TQ in already covered process (40 CFR 68.190(b)(3))",
    	R03: "Regulated substance present above TQ in new (or previously not covered) process (40 CFR 68.190(b)(4))",
    	R04: "Revised PHA / Hazard Review due to process change (40 CFR 68.190(b)(5))",
    	R05: "Revised OCA due to change (40 CFR 68.190(b)(6))",
    	R06: "Change in program level of covered process (40 CFR 68.190(b)(7))",
    	R07: "5-year update (40 CFR 68.190(b)(1))",
    	R08: "Process no longer covered (source has other processes that remain covered) (40 CFR 68.190(b)(7))",
    	R09: "Voluntary update (not described by any of the above reasons)"
    };
    var LatLongMethod = {
    	A1: "Address Matching - House Number",
    	A2: "Address Matching - Block Face",
    	A3: "Address Matching - Street Centerline",
    	A4: "Address Matching - Nearest Intersection",
    	A5: "Address Matching - Primary Name",
    	A6: "Address Matching - Digitized",
    	AO: "Address Matching - Other",
    	C1: "Census Block - 1990 - Centroid",
    	C2: "Census Block/Group - 1990 - Centroid",
    	C3: "Census Block Tract - 1990 - Centroid",
    	CO: "Census - Other",
    	G1: "Global Positioning System (GPS) Carrier Phase Static Relative Positioning Technique",
    	G2: "GPS Carrier Phase Kinematic Relative Positioning Technique",
    	G3: "GPS Code Measurements (Psuedo Range) Differential (DGPS)",
    	G4: "GPS Code Measurements (Psuedo Range) Precise Positioning Service",
    	G5: "GPS Code Measurements (Psuedo Range) Standard Positioning Service SA OFF",
    	G6: "GPS Code Measurements (Psuedo Range) Standard Positioning Service SA ON",
    	G7: "GPS Code Measurements (Psuedo Range) Standard Positioning Service Corrected",
    	GO: "GPS - Unspecified",
    	I1: "Interpolation - Map",
    	I2: "Interpolation - Photo",
    	I3: "Interpolation - Satellite",
    	I4: "Interpolation - Digital map source (TIGER)",
    	I5: "Interpolation - SPOT",
    	I6: "Interpolation - MSS (Multi-spectral Scanner)",
    	I7: "Interpolation - TM (Thermatic Mapper)",
    	IO: "Interpolation - Other",
    	L1: "Loran C",
    	P1: "Public Land Survey - Section",
    	P2: "Public Land Survey - Quarter Section",
    	P3: "Public Land Survey - Eighth Section",
    	P4: "Public Land Survey - Sixteenth Section",
    	P5: "Public Land Survey - Footing",
    	S1: "Classical Surveying Techniques",
    	Z1: "ZIP Code - Centroid",
    	Z2: "ZIP+2 Code - Centroid",
    	Z4: "ZIP+4 Code - Centroid",
    	OT: "Other",
    	UN: "Unknown"
    };
    var LatLongDescription = {
    	AB: "Administrative Building",
    	AE: "Atmospheric Emissions Treatment Unit",
    	AM: "Air Monitoring Station",
    	AS: "Air Release Stack",
    	AV: "Air Release Vent",
    	CE: "Center of Facility",
    	FC: "Facility Centroid",
    	IP: "Intake Pipe",
    	LC: "Loading Area Centroid",
    	LF: "Loading Facility",
    	LW: "Liquid Waste Treatment Unit",
    	NE: "NE Corner of Land Parcel",
    	NW: "NW Corner of Land Parcel",
    	OT: "Other",
    	PC: "Process Unit Area Centroid",
    	PF: "Plant Entrance (Freight)",
    	PG: "Plant Entrance (General)",
    	PP: "Plant Entrance (Personnel)",
    	PU: "Process Unit",
    	SD: "Solid Waste Treatment/Disposal Unit",
    	SE: "SE Corner of Land Parcel",
    	SP: "Lagoon or Settling Pond",
    	SS: "Solid Waste Storage Area",
    	ST: "Storage Tank",
    	SW: "SW Corner of Land Parcel",
    	UN: "Unknown",
    	WA: "Wellhead Protection Area",
    	WL: "Well",
    	WM: "Water Monitoring Station",
    	WR: "Water Release Pipe"
    };
    var InitiatingEvent = {
    	a: "Equipment Failure",
    	b: "Human Error",
    	c: "Natural (weather conditions, earthquake)",
    	d: "Unknown"
    };
    var lookups = {
    	ChemicalID: ChemicalID,
    	NAICSCode: NAICSCode,
    	DeregistrationReasonCode: DeregistrationReasonCode,
    	RMPSubmissionReasonCode: RMPSubmissionReasonCode,
    	LatLongMethod: LatLongMethod,
    	LatLongDescription: LatLongDescription,
    	InitiatingEvent: InitiatingEvent
    };

    /* src/components/AttrTable.svelte generated by Svelte v3.55.1 */

    const { Object: Object_1 } = globals;
    const file$3 = "src/components/AttrTable.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	const constants_0 = /*table*/ child_ctx[0][/*item_key*/ child_ctx[19]];
    	child_ctx[20] = constants_0;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[23] = list[i];
    	child_ctx[2] = i;
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[19] = list[i];
    	const constants_0 = /*table*/ child_ctx[0][/*item_key*/ child_ctx[19]];
    	child_ctx[20] = constants_0;
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	return child_ctx;
    }

    function get_each_context_4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	return child_ctx;
    }

    // (54:2) {#if levels.length < 2}
    function create_if_block_9(ctx) {
    	let div;
    	let t;
    	let mounted;
    	let dispose;
    	let each_value_4 = /*levels*/ ctx[8];
    	validate_each_argument(each_value_4);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_4.length; i += 1) {
    		each_blocks[i] = create_each_block_4(get_each_context_4(ctx, each_value_4, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = text(/*title*/ ctx[9]);
    			attr_dev(div, "class", "toc-item svelte-1pksr0h");
    			add_location(div, file$3, 54, 2, 1999);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*scroll*/ ctx[10], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_9.name,
    		type: "if",
    		source: "(54:2) {#if levels.length < 2}",
    		ctx
    	});

    	return block;
    }

    // (55:42) {#each levels as level}
    function create_each_block_4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("  ");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_4.name,
    		type: "each",
    		source: "(55:42) {#each levels as level}",
    		ctx
    	});

    	return block;
    }

    // (62:6) {:else}
    function create_else_block_3(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Collapse");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(62:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (60:6) {#if collapsed}
    function create_if_block_8(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Expand");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_8.name,
    		type: "if",
    		source: "(60:6) {#if collapsed}",
    		ctx
    	});

    	return block;
    }

    // (108:2) {:else}
    function create_else_block_2(ctx) {
    	let div;
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text("Missing");
    			attr_dev(div, "class", "missing svelte-1pksr0h");
    			div.hidden = /*collapsed*/ ctx[3];
    			add_location(div, file$3, 108, 4, 3923);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*collapsed*/ 8) {
    				prop_dev(div, "hidden", /*collapsed*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(108:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (67:2) {#if Array.isArray(table) ? table.length : table}
    function create_if_block$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block_1$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type_2(ctx, dirty) {
    		if (/*key*/ ctx[1] === "submission:_exec_summary") return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_2(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_2(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(67:2) {#if Array.isArray(table) ? table.length : table}",
    		ctx
    	});

    	return block;
    }

    // (72:4) {:else}
    function create_else_block(ctx) {
    	let table_1;
    	let t;
    	let each1_anchor;
    	let current;
    	let each_value_3 = Object.keys(/*table*/ ctx[0]);
    	validate_each_argument(each_value_3);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_1[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_1 = Object.keys(/*table*/ ctx[0]);
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			table_1 = element("table");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each1_anchor = empty();
    			table_1.hidden = /*collapsed*/ ctx[3];
    			attr_dev(table_1, "class", "svelte-1pksr0h");
    			add_location(table_1, file$3, 72, 6, 2538);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table_1, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(table_1, null);
    			}

    			insert_dev(target, t, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Object, table, lookups, renderValue, key, keys_to_skip, item_keys_to_skip*/ 227) {
    				each_value_3 = Object.keys(/*table*/ ctx[0]);
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_3(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(table_1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_3.length;
    			}

    			if (!current || dirty & /*collapsed*/ 8) {
    				prop_dev(table_1, "hidden", /*collapsed*/ ctx[3]);
    			}

    			if (dirty & /*collapsed, table, Object, key, Array*/ 11) {
    				each_value_1 = Object.keys(/*table*/ ctx[0]);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each1_anchor.parentNode, each1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table_1);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(72:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (68:4) {#if key === "submission:_exec_summary"}
    function create_if_block_1$1(ctx) {
    	let div;
    	let each_value = /*table*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "exec-summary svelte-1pksr0h");
    			div.hidden = /*collapsed*/ ctx[3];
    			add_location(div, file$3, 68, 6, 2408);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*table*/ 1) {
    				each_value = /*table*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*collapsed*/ 8) {
    				prop_dev(div, "hidden", /*collapsed*/ ctx[3]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(68:4) {#if key === \\\"submission:_exec_summary\\\"}",
    		ctx
    	});

    	return block;
    }

    // (76:10) {#if !(keys_to_skip.indexOf(key) > -1 || item_keys_to_skip.indexOf(item_key) > -1)}
    function create_if_block_5$1(ctx) {
    	let show_if = /*item_key*/ ctx[19].slice(0, 1) !== "_";
    	let if_block_anchor;
    	let if_block = show_if && create_if_block_6(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*table*/ 1) show_if = /*item_key*/ ctx[19].slice(0, 1) !== "_";

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_6(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5$1.name,
    		type: "if",
    		source: "(76:10) {#if !(keys_to_skip.indexOf(key) > -1 || item_keys_to_skip.indexOf(item_key) > -1)}",
    		ctx
    	});

    	return block;
    }

    // (77:12) {#if item_key.slice(0, 1) !== "_"}
    function create_if_block_6(ctx) {
    	let tr;
    	let td0;
    	let t0_value = /*item_key*/ ctx[19] + "";
    	let t0;
    	let td0_data_key_value;
    	let t1;
    	let td1;
    	let html_tag;
    	let raw_value = /*renderValue*/ ctx[7](/*key*/ ctx[1], /*item_key*/ ctx[19], /*val*/ ctx[20]) + "";
    	let t2;
    	let td1_data_key_value;
    	let t3;
    	let if_block = lookups[/*item_key*/ ctx[19]] && lookups[/*item_key*/ ctx[19]][/*val*/ ctx[20]] && create_if_block_7(ctx);

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			html_tag = new HtmlTag(false);
    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			attr_dev(td0, "class", "left svelte-1pksr0h");
    			attr_dev(td0, "data-key", td0_data_key_value = /*item_key*/ ctx[19]);
    			add_location(td0, file$3, 78, 16, 2829);
    			html_tag.a = t2;
    			attr_dev(td1, "class", "right svelte-1pksr0h");
    			attr_dev(td1, "data-key", td1_data_key_value = /*item_key*/ ctx[19]);
    			add_location(td1, file$3, 79, 16, 2898);
    			attr_dev(tr, "class", "svelte-1pksr0h");
    			add_location(tr, file$3, 77, 14, 2808);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, t0);
    			append_dev(tr, t1);
    			append_dev(tr, td1);
    			html_tag.m(raw_value, td1);
    			append_dev(td1, t2);
    			if (if_block) if_block.m(td1, null);
    			append_dev(tr, t3);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*table*/ 1 && t0_value !== (t0_value = /*item_key*/ ctx[19] + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*table*/ 1 && td0_data_key_value !== (td0_data_key_value = /*item_key*/ ctx[19])) {
    				attr_dev(td0, "data-key", td0_data_key_value);
    			}

    			if (dirty & /*key, table*/ 3 && raw_value !== (raw_value = /*renderValue*/ ctx[7](/*key*/ ctx[1], /*item_key*/ ctx[19], /*val*/ ctx[20]) + "")) html_tag.p(raw_value);

    			if (lookups[/*item_key*/ ctx[19]] && lookups[/*item_key*/ ctx[19]][/*val*/ ctx[20]]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_7(ctx);
    					if_block.c();
    					if_block.m(td1, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*table*/ 1 && td1_data_key_value !== (td1_data_key_value = /*item_key*/ ctx[19])) {
    				attr_dev(td1, "data-key", td1_data_key_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(77:12) {#if item_key.slice(0, 1) !== \\\"_\\\"}",
    		ctx
    	});

    	return block;
    }

    // (82:18) {#if (lookups[item_key] && lookups[item_key][val])}
    function create_if_block_7(ctx) {
    	let span;
    	let t_value = lookups[/*item_key*/ ctx[19]][/*val*/ ctx[20]] + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			attr_dev(span, "class", "lookup svelte-1pksr0h");
    			add_location(span, file$3, 82, 20, 3085);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*table*/ 1 && t_value !== (t_value = lookups[/*item_key*/ ctx[19]][/*val*/ ctx[20]] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_7.name,
    		type: "if",
    		source: "(82:18) {#if (lookups[item_key] && lookups[item_key][val])}",
    		ctx
    	});

    	return block;
    }

    // (74:8) {#each Object.keys(table) as item_key}
    function create_each_block_3(ctx) {
    	let show_if = !(/*keys_to_skip*/ ctx[5].indexOf(/*key*/ ctx[1]) > -1 || /*item_keys_to_skip*/ ctx[6].indexOf(/*item_key*/ ctx[19]) > -1);
    	let if_block_anchor;
    	let if_block = show_if && create_if_block_5$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*key, table*/ 3) show_if = !(/*keys_to_skip*/ ctx[5].indexOf(/*key*/ ctx[1]) > -1 || /*item_keys_to_skip*/ ctx[6].indexOf(/*item_key*/ ctx[19]) > -1);

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_5$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(74:8) {#each Object.keys(table) as item_key}",
    		ctx
    	});

    	return block;
    }

    // (93:8) {#if item_key.slice(0, 1) === "_"}
    function create_if_block_2$1(ctx) {
    	let div;
    	let show_if;
    	let current_block_type_index;
    	let if_block;
    	let t;
    	let current;
    	const if_block_creators = [create_if_block_3$1, create_if_block_4$1, create_else_block_1];
    	const if_blocks = [];

    	function select_block_type_3(ctx, dirty) {
    		if (dirty & /*table*/ 1) show_if = null;
    		if (/*item_key*/ ctx[19] == "_exec_summary") return 0;
    		if (show_if == null) show_if = !!Array.isArray(/*val*/ ctx[20]);
    		if (show_if) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type_3(ctx, -1);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			t = space();
    			div.hidden = /*collapsed*/ ctx[3];
    			attr_dev(div, "class", "svelte-1pksr0h");
    			add_location(div, file$3, 93, 12, 3408);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_3(ctx, dirty);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, t);
    			}

    			if (!current || dirty & /*collapsed*/ 8) {
    				prop_dev(div, "hidden", /*collapsed*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(93:8) {#if item_key.slice(0, 1) === \\\"_\\\"}",
    		ctx
    	});

    	return block;
    }

    // (101:12) {:else}
    function create_else_block_1(ctx) {
    	let attrtable;
    	let current;

    	attrtable = new AttrTable({
    			props: {
    				table: /*val*/ ctx[20],
    				key: /*key*/ ctx[1] + ":" + /*item_key*/ ctx[19],
    				i: -1
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(attrtable.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(attrtable, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const attrtable_changes = {};
    			if (dirty & /*table*/ 1) attrtable_changes.table = /*val*/ ctx[20];
    			if (dirty & /*key, table*/ 3) attrtable_changes.key = /*key*/ ctx[1] + ":" + /*item_key*/ ctx[19];
    			attrtable.$set(attrtable_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(attrtable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(attrtable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(attrtable, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(101:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (97:41) 
    function create_if_block_4$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value_2 = /*val*/ ctx[20];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*table, Object, key*/ 3) {
    				each_value_2 = /*val*/ ctx[20];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_2.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4$1.name,
    		type: "if",
    		source: "(97:41) ",
    		ctx
    	});

    	return block;
    }

    // (95:12) {#if item_key == "_exec_summary"}
    function create_if_block_3$1(ctx) {
    	let attrtable;
    	let current;

    	attrtable = new AttrTable({
    			props: {
    				table: /*val*/ ctx[20],
    				key: /*key*/ ctx[1] + ":" + /*item_key*/ ctx[19],
    				i: -1
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(attrtable.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(attrtable, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const attrtable_changes = {};
    			if (dirty & /*table*/ 1) attrtable_changes.table = /*val*/ ctx[20];
    			if (dirty & /*key, table*/ 3) attrtable_changes.key = /*key*/ ctx[1] + ":" + /*item_key*/ ctx[19];
    			attrtable.$set(attrtable_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(attrtable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(attrtable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(attrtable, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(95:12) {#if item_key == \\\"_exec_summary\\\"}",
    		ctx
    	});

    	return block;
    }

    // (98:14) {#each val as entry, i}
    function create_each_block_2(ctx) {
    	let attrtable;
    	let current;

    	attrtable = new AttrTable({
    			props: {
    				table: /*entry*/ ctx[23],
    				key: /*key*/ ctx[1] + ":" + /*item_key*/ ctx[19],
    				i: /*i*/ ctx[2]
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(attrtable.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(attrtable, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const attrtable_changes = {};
    			if (dirty & /*table*/ 1) attrtable_changes.table = /*entry*/ ctx[23];
    			if (dirty & /*key, table*/ 3) attrtable_changes.key = /*key*/ ctx[1] + ":" + /*item_key*/ ctx[19];
    			attrtable.$set(attrtable_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(attrtable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(attrtable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(attrtable, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(98:14) {#each val as entry, i}",
    		ctx
    	});

    	return block;
    }

    // (91:6) {#each Object.keys(table) as item_key}
    function create_each_block_1(ctx) {
    	let show_if = /*item_key*/ ctx[19].slice(0, 1) === "_";
    	let if_block_anchor;
    	let current;
    	let if_block = show_if && create_if_block_2$1(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*table*/ 1) show_if = /*item_key*/ ctx[19].slice(0, 1) === "_";

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*table*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_2$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(91:6) {#each Object.keys(table) as item_key}",
    		ctx
    	});

    	return block;
    }

    // (70:8) {#each table as row}
    function create_each_block$1(ctx) {
    	let t_value = /*row*/ ctx[16].SummaryText + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*table*/ 1 && t_value !== (t_value = /*row*/ ctx[16].SummaryText + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(70:8) {#each table as row}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div;
    	let t0;
    	let h4;
    	let t1;
    	let t2;
    	let button;
    	let t3;
    	let show_if;
    	let current_block_type_index;
    	let if_block2;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*levels*/ ctx[8].length < 2 && create_if_block_9(ctx);

    	function select_block_type(ctx, dirty) {
    		if (/*collapsed*/ ctx[3]) return create_if_block_8;
    		return create_else_block_3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block1 = current_block_type(ctx);
    	const if_block_creators = [create_if_block$1, create_else_block_2];
    	const if_blocks = [];

    	function select_block_type_1(ctx, dirty) {
    		if (dirty & /*table*/ 1) show_if = null;

    		if (show_if == null) show_if = !!(Array.isArray(/*table*/ ctx[0])
    		? /*table*/ ctx[0].length
    		: /*table*/ ctx[0]);

    		if (show_if) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type_1(ctx, -1);
    	if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			h4 = element("h4");
    			t1 = text(/*title*/ ctx[9]);
    			t2 = space();
    			button = element("button");
    			if_block1.c();
    			t3 = space();
    			if_block2.c();
    			attr_dev(button, "class", "toggle svelte-1pksr0h");
    			add_location(button, file$3, 58, 4, 2143);
    			attr_dev(h4, "class", "svelte-1pksr0h");
    			add_location(h4, file$3, 56, 2, 2105);
    			attr_dev(div, "class", "tablewrapper svelte-1pksr0h");
    			add_location(div, file$3, 52, 0, 1944);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, h4);
    			append_dev(h4, t1);
    			append_dev(h4, t2);
    			append_dev(h4, button);
    			if_block1.m(button, null);
    			/*h4_binding*/ ctx[12](h4);
    			append_dev(div, t3);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[11], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*levels*/ ctx[8].length < 2) if_block0.p(ctx, dirty);

    			if (current_block_type !== (current_block_type = select_block_type(ctx))) {
    				if_block1.d(1);
    				if_block1 = current_block_type(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(button, null);
    				}
    			}

    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type_1(ctx, dirty);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block2 = if_blocks[current_block_type_index];

    				if (!if_block2) {
    					if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block2.c();
    				} else {
    					if_block2.p(ctx, dirty);
    				}

    				transition_in(if_block2, 1);
    				if_block2.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if_block1.d();
    			/*h4_binding*/ ctx[12](null);
    			if_blocks[current_block_type_index].d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AttrTable', slots, []);
    	let { table, key, i } = $$props;
    	const key_parts = key.split(":");

    	const sections = {
    		"submission": "Submission",
    		"submission:_processes": "Process",
    		"submission:_emerg_resp": "Emergency Response",
    		"submission:_exec_summary": "Executive Summary",
    		"submission:_processes:_naics": "Prevention Programs by Industry Code",
    		"submission:_processes:_naics:_desc": "NAICS Code Description",
    		"submission:_processes:_naics:_prev_prog_3": "Prevention Program (for Program Level 3)",
    		"submission:_processes:_naics:_prev_prog_3:_chemicals": "Program Chemical",
    		"submission:_processes:_naics:_prev_prog_2": "Prevention Program (for Program Level 2)",
    		"submission:_processes:_naics:_prev_prog_2:_chemicals": "Program Chemical",
    		"submission:_processes:_chemicals": "Process Chemical",
    		"submission:_processes:_chemicals:_chemical": "Chemical Information",
    		"submission:_processes:_chemicals:_flam_mix_chemicals": "Flammable Mixture Chemical",
    		"submission:_accidents": "Accident",
    		"submission:_accidents:_chemicals": "Accident Chemical",
    		"submission:_accidents:_chemicals:_flam_mix_chemicals": "Flammable Mixture Accident Chemical"
    	};

    	const keys_to_skip = [];
    	const item_keys_to_skip = ["FacilityID"];

    	const linkers = {
    		"EPAFacilityID": val => `#/facility:${val}`,
    		"FacilityState": val => `#/state:${val}`
    	};

    	const renderValue = (key, item_key, val) => {
    		if (val === null) {
    			return "";
    		} else {
    			if (linkers[item_key]) {
    				const url = linkers[item_key](val);
    				return `<a href='${url}'>${val}</a>`;
    			} else {
    				return val;
    			}
    		}
    	};

    	let levels = key.split(":").slice(1);
    	let collapsed = false;
    	let title = sections[key] + (i > -1 ? ` #${parseInt(i) + 1}` : "");
    	let header;

    	const scroll = e => {
    		header.scrollIntoView();
    	};

    	$$self.$$.on_mount.push(function () {
    		if (table === undefined && !('table' in $$props || $$self.$$.bound[$$self.$$.props['table']])) {
    			console.warn("<AttrTable> was created without expected prop 'table'");
    		}

    		if (key === undefined && !('key' in $$props || $$self.$$.bound[$$self.$$.props['key']])) {
    			console.warn("<AttrTable> was created without expected prop 'key'");
    		}

    		if (i === undefined && !('i' in $$props || $$self.$$.bound[$$self.$$.props['i']])) {
    			console.warn("<AttrTable> was created without expected prop 'i'");
    		}
    	});

    	const writable_props = ['table', 'key', 'i'];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AttrTable> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(3, collapsed = !collapsed);

    	function h4_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			header = $$value;
    			$$invalidate(4, header);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('table' in $$props) $$invalidate(0, table = $$props.table);
    		if ('key' in $$props) $$invalidate(1, key = $$props.key);
    		if ('i' in $$props) $$invalidate(2, i = $$props.i);
    	};

    	$$self.$capture_state = () => ({
    		lookups,
    		table,
    		key,
    		i,
    		key_parts,
    		sections,
    		keys_to_skip,
    		item_keys_to_skip,
    		linkers,
    		renderValue,
    		levels,
    		collapsed,
    		title,
    		header,
    		scroll
    	});

    	$$self.$inject_state = $$props => {
    		if ('table' in $$props) $$invalidate(0, table = $$props.table);
    		if ('key' in $$props) $$invalidate(1, key = $$props.key);
    		if ('i' in $$props) $$invalidate(2, i = $$props.i);
    		if ('levels' in $$props) $$invalidate(8, levels = $$props.levels);
    		if ('collapsed' in $$props) $$invalidate(3, collapsed = $$props.collapsed);
    		if ('title' in $$props) $$invalidate(9, title = $$props.title);
    		if ('header' in $$props) $$invalidate(4, header = $$props.header);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		table,
    		key,
    		i,
    		collapsed,
    		header,
    		keys_to_skip,
    		item_keys_to_skip,
    		renderValue,
    		levels,
    		title,
    		scroll,
    		click_handler,
    		h4_binding
    	];
    }

    class AttrTable extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { table: 0, key: 1, i: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AttrTable",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get table() {
    		throw new Error("<AttrTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set table(value) {
    		throw new Error("<AttrTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get key() {
    		throw new Error("<AttrTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set key(value) {
    		throw new Error("<AttrTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get i() {
    		throw new Error("<AttrTable>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set i(value) {
    		throw new Error("<AttrTable>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/Submission.svelte generated by Svelte v3.55.1 */
    const file$2 = "src/components/Submission.svelte";

    function create_fragment$2(ctx) {
    	let section;
    	let h2;
    	let t0;
    	let t1_value = /*item*/ ctx[0].FacilityID + "";
    	let t1;
    	let t2;
    	let div0;
    	let t3;
    	let a;
    	let t4;
    	let a_href_value;
    	let t5;
    	let div1;
    	let t6;
    	let attrtable;
    	let t7;
    	let script;
    	let current;

    	attrtable = new AttrTable({
    			props: {
    				table: /*item*/ ctx[0],
    				key: "submission",
    				i: "-1"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			section = element("section");
    			h2 = element("h2");
    			t0 = text("Submission #");
    			t1 = text(t1_value);
    			t2 = space();
    			div0 = element("div");
    			t3 = text("⭠ ");
    			a = element("a");
    			t4 = text("View all submissions from this facility");
    			t5 = space();
    			div1 = element("div");
    			t6 = space();
    			create_component(attrtable.$$.fragment);
    			t7 = space();
    			script = element("script");
    			script.textContent = "(() => {\n      let container = document.querySelector(\".toc-container\");\n      [].map.call(document.querySelectorAll(\".toc-item\"), (x) => {\n        container.appendChild(x);\n      });\n    })();";
    			add_location(h2, file$2, 6, 2, 113);
    			attr_dev(a, "href", a_href_value = "#/facility:" + /*item*/ ctx[0].EPAFacilityID);
    			add_location(a, file$2, 7, 9, 161);
    			add_location(div0, file$2, 7, 2, 154);
    			attr_dev(div1, "class", "toc-container svelte-6u7zzx");
    			add_location(div1, file$2, 8, 2, 255);
    			add_location(script, file$2, 10, 2, 341);
    			attr_dev(section, "id", "submission");
    			add_location(section, file$2, 5, 0, 85);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h2);
    			append_dev(h2, t0);
    			append_dev(h2, t1);
    			append_dev(section, t2);
    			append_dev(section, div0);
    			append_dev(div0, t3);
    			append_dev(div0, a);
    			append_dev(a, t4);
    			append_dev(section, t5);
    			append_dev(section, div1);
    			append_dev(section, t6);
    			mount_component(attrtable, section, null);
    			append_dev(section, t7);
    			append_dev(section, script);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if ((!current || dirty & /*item*/ 1) && t1_value !== (t1_value = /*item*/ ctx[0].FacilityID + "")) set_data_dev(t1, t1_value);

    			if (!current || dirty & /*item*/ 1 && a_href_value !== (a_href_value = "#/facility:" + /*item*/ ctx[0].EPAFacilityID)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			const attrtable_changes = {};
    			if (dirty & /*item*/ 1) attrtable_changes.table = /*item*/ ctx[0];
    			attrtable.$set(attrtable_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(attrtable.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(attrtable.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_component(attrtable);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Submission', slots, []);
    	let { item } = $$props;

    	$$self.$$.on_mount.push(function () {
    		if (item === undefined && !('item' in $$props || $$self.$$.bound[$$self.$$.props['item']])) {
    			console.warn("<Submission> was created without expected prop 'item'");
    		}
    	});

    	const writable_props = ['item'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Submission> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    	};

    	$$self.$capture_state = () => ({ AttrTable, item });

    	$$self.$inject_state = $$props => {
    		if ('item' in $$props) $$invalidate(0, item = $$props.item);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [item];
    }

    class Submission extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { item: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Submission",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get item() {
    		throw new Error("<Submission>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set item(value) {
    		throw new Error("<Submission>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/Landing.svelte generated by Svelte v3.55.1 */

    const file$1 = "src/pages/Landing.svelte";

    function create_fragment$1(ctx) {
    	let h2;
    	let t1;
    	let p0;
    	let t2;
    	let a0;
    	let t4;
    	let a1;
    	let t6;
    	let a2;
    	let t8;
    	let a3;
    	let t10;
    	let t11;
    	let p1;
    	let t12;
    	let a4;
    	let t14;
    	let t15;
    	let p2;
    	let t17;
    	let ul;
    	let li0;
    	let t18;
    	let a5;
    	let t20;
    	let t21;
    	let li1;
    	let t22;
    	let b0;
    	let t24;
    	let a6;
    	let t26;
    	let t27;
    	let li2;
    	let t28;
    	let b1;
    	let t30;
    	let a7;
    	let t32;
    	let t33;
    	let li3;
    	let t34;
    	let b2;
    	let t36;
    	let a8;
    	let t38;
    	let i;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Introduction and Instructions";
    			t1 = space();
    			p0 = element("p");
    			t2 = text("This online tool provides access to key information ");
    			a0 = element("a");
    			a0.textContent = "extracted";
    			t4 = text(" from ");
    			a1 = element("a");
    			a1.textContent = "the EPA's Risk Management Program (RMP) database";
    			t6 = text(", obtained by the ");
    			a2 = element("a");
    			a2.textContent = "Data Liberation Project";
    			t8 = text(" via ");
    			a3 = element("a");
    			a3.textContent = "FOIA";
    			t10 = text(".");
    			t11 = space();
    			p1 = element("p");
    			t12 = text("The RMP database is somewhat complex, and many of the fields in it aren't self-explanatory. The Data Liberation Project strongly suggests you ");
    			a4 = element("a");
    			a4.textContent = "read this guide before continuing";
    			t14 = text(".");
    			t15 = space();
    			p2 = element("p");
    			p2.textContent = "This tool provides several views on the data:";
    			t17 = space();
    			ul = element("ul");
    			li0 = element("li");
    			t18 = text("A ");
    			a5 = element("a");
    			a5.textContent = "listing of all states";
    			t20 = text(" represented in the database.");
    			t21 = space();
    			li1 = element("li");
    			t22 = text("For ");
    			b0 = element("b");
    			b0.textContent = "each state";
    			t24 = text(" (e.g., ");
    			a6 = element("a");
    			a6.textContent = "Texas";
    			t26 = text(") — county-by-county listing of all facilities that have, at any point, filed an RMP submission.");
    			t27 = space();
    			li2 = element("li");
    			t28 = text("For ");
    			b1 = element("b");
    			b1.textContent = "each facility";
    			t30 = text(" (e.g., ");
    			a7 = element("a");
    			a7.textContent = "this facility";
    			t32 = text(") — overview information and a table linking to all the facility's submissions");
    			t33 = space();
    			li3 = element("li");
    			t34 = text("For ");
    			b2 = element("b");
    			b2.textContent = "each submission";
    			t36 = text(" (e.g., ");
    			a8 = element("a");
    			a8.textContent = "#43946";
    			t38 = text(") — raw data from the core database tables, covering information on the submission and facility, processes, process chemicals, prevention programs, accident history, and executive summary. ");
    			i = element("i");
    			i.textContent = "Note: Although this represents a large chunk of the data, it is not exhaustive of all tables and fields in the database, for which you should consult the raw data, available through the documentation linked above.";
    			add_location(h2, file$1, 0, 0, 0);
    			attr_dev(a0, "href", "https://github.com/data-liberation-project/epa-rmp-viewer");
    			add_location(a0, file$1, 2, 54, 97);
    			attr_dev(a1, "href", "https://docs.google.com/document/d/1jrLXtv0knnACiPXJ1ZRFXR1GaPWCHJWWjin4rsthFbQ/edit");
    			add_location(a1, file$1, 2, 141, 184);
    			attr_dev(a2, "href", "https://www.data-liberation-project.org/");
    			add_location(a2, file$1, 2, 306, 349);
    			attr_dev(a3, "href", "https://www.data-liberation-project.org/requests/epa-risk-management-program/");
    			add_location(a3, file$1, 2, 389, 432);
    			add_location(p0, file$1, 1, 0, 39);
    			attr_dev(a4, "href", "https://docs.google.com/document/d/1jrLXtv0knnACiPXJ1ZRFXR1GaPWCHJWWjin4rsthFbQ/edit");
    			add_location(a4, file$1, 5, 144, 683);
    			add_location(p1, file$1, 4, 0, 535);
    			add_location(p2, file$1, 7, 0, 822);
    			attr_dev(a5, "href", "#/list:states");
    			add_location(a5, file$1, 11, 8, 892);
    			attr_dev(li0, "class", "svelte-wz9vls");
    			add_location(li0, file$1, 11, 2, 886);
    			add_location(b0, file$1, 12, 10, 986);
    			attr_dev(a6, "href", "#/state:TX");
    			add_location(a6, file$1, 12, 35, 1011);
    			attr_dev(li1, "class", "svelte-wz9vls");
    			add_location(li1, file$1, 12, 2, 978);
    			add_location(b1, file$1, 13, 10, 1153);
    			attr_dev(a7, "href", "#/facility:100000070987");
    			add_location(a7, file$1, 13, 38, 1181);
    			attr_dev(li2, "class", "svelte-wz9vls");
    			add_location(li2, file$1, 13, 2, 1145);
    			add_location(b2, file$1, 14, 10, 1326);
    			attr_dev(a8, "href", "#/submission:43946");
    			add_location(a8, file$1, 14, 40, 1356);
    			add_location(i, file$1, 14, 268, 1584);
    			attr_dev(li3, "class", "svelte-wz9vls");
    			add_location(li3, file$1, 14, 2, 1318);
    			add_location(ul, file$1, 10, 0, 879);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t2);
    			append_dev(p0, a0);
    			append_dev(p0, t4);
    			append_dev(p0, a1);
    			append_dev(p0, t6);
    			append_dev(p0, a2);
    			append_dev(p0, t8);
    			append_dev(p0, a3);
    			append_dev(p0, t10);
    			insert_dev(target, t11, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t12);
    			append_dev(p1, a4);
    			append_dev(p1, t14);
    			insert_dev(target, t15, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t17, anchor);
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li0);
    			append_dev(li0, t18);
    			append_dev(li0, a5);
    			append_dev(li0, t20);
    			append_dev(ul, t21);
    			append_dev(ul, li1);
    			append_dev(li1, t22);
    			append_dev(li1, b0);
    			append_dev(li1, t24);
    			append_dev(li1, a6);
    			append_dev(li1, t26);
    			append_dev(ul, t27);
    			append_dev(ul, li2);
    			append_dev(li2, t28);
    			append_dev(li2, b1);
    			append_dev(li2, t30);
    			append_dev(li2, a7);
    			append_dev(li2, t32);
    			append_dev(ul, t33);
    			append_dev(ul, li3);
    			append_dev(li3, t34);
    			append_dev(li3, b2);
    			append_dev(li3, t36);
    			append_dev(li3, a8);
    			append_dev(li3, t38);
    			append_dev(li3, i);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t11);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t15);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t17);
    			if (detaching) detach_dev(ul);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Landing', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Landing> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Landing extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Landing",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.55.1 */

    const { console: console_1 } = globals;
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	return child_ctx;
    }

    // (129:52) 
    function create_if_block_5(ctx) {
    	let submission;
    	let current;

    	submission = new Submission({
    			props: { item: /*app*/ ctx[0].view_data },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(submission.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(submission, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const submission_changes = {};
    			if (dirty & /*app*/ 1) submission_changes.item = /*app*/ ctx[0].view_data;
    			submission.$set(submission_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(submission.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(submission.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(submission, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(129:52) ",
    		ctx
    	});

    	return block;
    }

    // (126:51) 
    function create_if_block_4(ctx) {
    	let facility;
    	let current;

    	facility = new Facility({
    			props: { item: /*app*/ ctx[0].view_data },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(facility.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(facility, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const facility_changes = {};
    			if (dirty & /*app*/ 1) facility_changes.item = /*app*/ ctx[0].view_data;
    			facility.$set(facility_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(facility.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(facility.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(facility, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(126:51) ",
    		ctx
    	});

    	return block;
    }

    // (123:48) 
    function create_if_block_3(ctx) {
    	let state;
    	let current;

    	state = new State({
    			props: { item: /*app*/ ctx[0].view_data },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(state.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(state, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const state_changes = {};
    			if (dirty & /*app*/ 1) state_changes.item = /*app*/ ctx[0].view_data;
    			state.$set(state_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(state.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(state.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(state, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(123:48) ",
    		ctx
    	});

    	return block;
    }

    // (111:77) 
    function create_if_block_2(ctx) {
    	let section;
    	let h2;
    	let t1;
    	let ul;
    	let each_value = /*app*/ ctx[0].view_data.sort(func);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");
    			h2 = element("h2");
    			h2.textContent = "Facilities by State";
    			t1 = space();
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h2, file, 112, 4, 2863);
    			attr_dev(ul, "id", "states-list");
    			add_location(ul, file, 113, 4, 2896);
    			attr_dev(section, "id", "states");
    			add_location(section, file, 111, 2, 2837);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h2);
    			append_dev(section, t1);
    			append_dev(section, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*app*/ 1) {
    				each_value = /*app*/ ctx[0].view_data.sort(func);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(111:77) ",
    		ctx
    	});

    	return block;
    }

    // (98:59) 
    function create_if_block_1(ctx) {
    	let section;
    	let h2;
    	let label;
    	let t1;
    	let input;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			section = element("section");
    			h2 = element("h2");
    			label = element("label");
    			label.textContent = "Load a submission JSON file";
    			t1 = space();
    			input = element("input");
    			attr_dev(label, "for", "avatar");
    			add_location(label, file, 99, 8, 2528);
    			add_location(h2, file, 99, 4, 2524);
    			attr_dev(input, "accept", "application/json");
    			attr_dev(input, "id", "sub_file");
    			attr_dev(input, "name", "sub_file");
    			attr_dev(input, "type", "file");
    			add_location(input, file, 100, 4, 2593);
    			attr_dev(section, "id", "chooser");
    			add_location(section, file, 98, 2, 2497);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, h2);
    			append_dev(h2, label);
    			append_dev(section, t1);
    			append_dev(section, input);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "change", /*input_change_handler*/ ctx[5]),
    					listen_dev(input, "change", /*readJSON*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(98:59) ",
    		ctx
    	});

    	return block;
    }

    // (95:0) {#if app.view == "page"}
    function create_if_block(ctx) {
    	let switch_instance;
    	let switch_instance_anchor;
    	let current;
    	var switch_value = /*pages*/ ctx[2][/*app*/ ctx[0].view_arg];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    	}

    	const block = {
    		c: function create() {
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			switch_instance_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (switch_instance) mount_component(switch_instance, target, anchor);
    			insert_dev(target, switch_instance_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (switch_value !== (switch_value = /*pages*/ ctx[2][/*app*/ ctx[0].view_arg])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, switch_instance_anchor.parentNode, switch_instance_anchor);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(switch_instance_anchor);
    			if (switch_instance) destroy_component(switch_instance, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(95:0) {#if app.view == \\\"page\\\"}",
    		ctx
    	});

    	return block;
    }

    // (115:6) {#each app.view_data.sort((a, b) => a.name < b.name) as s}
    function create_each_block(ctx) {
    	let li;
    	let a;
    	let t0_value = /*s*/ ctx[11].name + "";
    	let t0;
    	let t1;
    	let t2_value = /*s*/ ctx[11].count + "";
    	let t2;
    	let t3;
    	let a_href_value;
    	let t4;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = text(" (");
    			t2 = text(t2_value);
    			t3 = text(")");
    			t4 = space();
    			attr_dev(a, "href", a_href_value = "#/state:" + /*s*/ ctx[11].abbr);
    			add_location(a, file, 116, 10, 3006);
    			add_location(li, file, 115, 8, 2991);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t0);
    			append_dev(a, t1);
    			append_dev(a, t2);
    			append_dev(a, t3);
    			append_dev(li, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*app*/ 1 && t0_value !== (t0_value = /*s*/ ctx[11].name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*app*/ 1 && t2_value !== (t2_value = /*s*/ ctx[11].count + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*app*/ 1 && a_href_value !== (a_href_value = "#/state:" + /*s*/ ctx[11].abbr)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(115:6) {#each app.view_data.sort((a, b) => a.name < b.name) as s}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let h1;
    	let a0;
    	let t1;
    	let div;
    	let t2;
    	let b;
    	let a1;
    	let t4;
    	let t5;
    	let current_block_type_index;
    	let if_block;
    	let t6;
    	let hr;
    	let current;
    	let mounted;
    	let dispose;

    	const if_block_creators = [
    		create_if_block,
    		create_if_block_1,
    		create_if_block_2,
    		create_if_block_3,
    		create_if_block_4,
    		create_if_block_5
    	];

    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*app*/ ctx[0].view == "page") return 0;
    		if (/*app*/ ctx[0].view === "file" && /*app*/ ctx[0].view_arg == "chooser") return 1;
    		if (/*app*/ ctx[0].view == "list" && /*app*/ ctx[0].view_arg == "states" && /*app*/ ctx[0].view_data) return 2;
    		if (/*app*/ ctx[0].view == "state" && /*app*/ ctx[0].view_data) return 3;
    		if (/*app*/ ctx[0].view == "facility" && /*app*/ ctx[0].view_data) return 4;
    		if (/*app*/ ctx[0].view == "submission" && /*app*/ ctx[0].view_data) return 5;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			h1 = element("h1");
    			a0 = element("a");
    			a0.textContent = "RMP Submission Viewer";
    			t1 = space();
    			div = element("div");
    			t2 = text("❗This resource is a work in progress; please consult ");
    			b = element("b");
    			a1 = element("a");
    			a1.textContent = "the documentation";
    			t4 = text(".");
    			t5 = space();
    			if (if_block) if_block.c();
    			t6 = space();
    			hr = element("hr");
    			attr_dev(a0, "href", "#");
    			attr_dev(a0, "class", "svelte-5fosut");
    			add_location(a0, file, 90, 6, 2110);
    			attr_dev(h1, "class", "svelte-5fosut");
    			add_location(h1, file, 90, 2, 2106);
    			attr_dev(a1, "href", "https://docs.google.com/document/d/1jrLXtv0knnACiPXJ1ZRFXR1GaPWCHJWWjin4rsthFbQ/edit");
    			add_location(a1, file, 91, 77, 2230);
    			add_location(b, file, 91, 74, 2227);
    			attr_dev(div, "class", "warning svelte-5fosut");
    			add_location(div, file, 91, 0, 2153);
    			add_location(hr, file, 132, 0, 3380);
    			attr_dev(main, "class", "svelte-5fosut");
    			add_location(main, file, 89, 0, 2097);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, h1);
    			append_dev(h1, a0);
    			append_dev(main, t1);
    			append_dev(main, div);
    			append_dev(div, t2);
    			append_dev(div, b);
    			append_dev(b, a1);
    			append_dev(div, t4);
    			append_dev(main, t5);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(main, null);
    			}

    			append_dev(main, t6);
    			append_dev(main, hr);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "hashchange", /*routeChange*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(main, t6);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = (a, b) => a.name < b.name;

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const pages = { "landing": Landing };

    	let app = {
    		view: null,
    		view_arg: null,
    		view_data: null
    	};

    	const resetApp = () => {
    		$$invalidate(0, app.view = null, app);
    		$$invalidate(0, app.view_arg = null, app);
    		$$invalidate(0, app.view_data = null, app);
    	};

    	let item;
    	let files;

    	const readJSON = () => {
    		if (files) {
    			for (const file of files) {
    				const reader = new FileReader();

    				reader.onload = function (e) {
    					$$invalidate(0, app.view_data = JSON.parse(reader.result), app);
    					$$invalidate(0, app.view = "submission", app);
    				};

    				reader.readAsText(file);
    			}
    		}
    	};

    	const urlTemplates = {
    		"list": kind => `./data/facilities/states.json`,
    		"state": state => `./data/facilities/by-state/${state}.json`,
    		"facility": fac_id => `./data/facilities/detail/${fac_id}.json`,
    		"submission": sub_id => `./data/submissions/${sub_id}.json`
    	};

    	const fetchViewData = (view, view_arg) => {
    		var urlMaker = urlTemplates[view];

    		if (urlMaker) {
    			const url = urlTemplates[view](view_arg);

    			fetch(url).then(response => response.json()).then(data => {
    				$$invalidate(0, app.view_data = data, app);
    			}).catch(error => {
    				console.log(error);
    			});
    		}
    	};

    	const routeChange = () => {
    		resetApp();

    		if (location.hash === "") {
    			$$invalidate(0, app.view = "page", app);
    			$$invalidate(0, app.view_arg = "landing", app);
    		} else if (location.hash.indexOf(":") < 0) {
    			location.hash = "";
    		} else {
    			const match = location.hash.match(/^#\/([^:]+):([^:+]+)/);

    			if (match) {
    				$$invalidate(0, app.view = match[1], app);
    				$$invalidate(0, app.view_arg = match[2], app);
    				fetchCurrentView();
    			} else {
    				console.log("Could not parse location.hash: " + location.hash);
    			}
    		}
    	};

    	const fetchCurrentView = () => {
    		fetchViewData(app.view, app.view_arg);
    	};

    	routeChange();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_change_handler() {
    		files = this.files;
    		$$invalidate(1, files);
    	}

    	$$self.$capture_state = () => ({
    		State,
    		Facility,
    		Submission,
    		Landing,
    		pages,
    		app,
    		resetApp,
    		item,
    		files,
    		readJSON,
    		urlTemplates,
    		fetchViewData,
    		routeChange,
    		fetchCurrentView
    	});

    	$$self.$inject_state = $$props => {
    		if ('app' in $$props) $$invalidate(0, app = $$props.app);
    		if ('item' in $$props) item = $$props.item;
    		if ('files' in $$props) $$invalidate(1, files = $$props.files);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [app, files, pages, readJSON, routeChange, input_change_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
      target: document.body,
      props: {},
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
