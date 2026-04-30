#!/bin/sh

git_hooks_dir=""

# Standard git checkout
if [ -d ".git" ]; then
    git_hooks_dir=".git/hooks"
fi

# Git worktree checkout
if [ -f ".git" ]; then
    gitdir_path=$(sed -n 's/^gitdir: //p' .git)
    if [ -n "$gitdir_path" ]; then
        git_hooks_dir="$gitdir_path/hooks"
    fi
fi

if [ -z "$git_hooks_dir" ]; then
    exit 0
fi

mkdir -p "$git_hooks_dir"

cp "$(dirname "$0")/pre-commit" "$git_hooks_dir/pre-commit"
chmod +x "$git_hooks_dir/pre-commit"
