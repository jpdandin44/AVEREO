"""Preparation safety checks on fictitious files; no server connection."""
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import prepare_shared_menu as menu
from select_shared_menu import coupe_menu_only


class SharedMenuPreparationTests(unittest.TestCase):
    def test_coupe_overlay_preserves_oauth_and_bom(self):
        original = ('\ufeff<head></head>\r\n'
                    '            <button id="online-auth-btn" onclick="app.handleOnlineAuthClick()" title="Connexion utilisateur AVEREO"><i class="fas fa-user-circle"></i> Connexion AVEREO</button>\r\n'
                    '            <button onclick="app.resetProject()">Nouveau</button>\r\n'
                    '        </aside>\r\n\r\n        <!-- MAIN WORKSPACE : CANVAS -->\r\n'
                    'const mode = "drupal_oauth";\r\n'
                    'btn.innerHTML = `<i class="fas fa-user-check"></i> ${this.escapeHTML(label)}`;\r\n').encode()
        accepted = ('    <script defer src="/account-menu.js"></script>\n'
                    '            <avereo-account-menu id="coupe-account-menu">\n'
                    '                <button slot="logout" id="online-auth-btn" onclick="app.handleOnlineAuthClick()">Connexion AVEREO</button>\n'
                    '            </avereo-account-menu>\n'
                    "btn.textContent = 'Se déconnecter';\n").encode()
        adapted = coupe_menu_only(original, accepted)
        self.assertTrue(adapted.startswith(b'\xef\xbb\xbf'))
        self.assertIn(b'const mode = "drupal_oauth";\r\n', adapted)
        self.assertNotIn(b'connect_gateway', adapted)
        self.assertNotIn(b'\n', adapted.replace(b'\r\n', b''))
        self.assertEqual(adapted.count(b'id="online-auth-btn"'), 1)
        with self.assertRaises(ValueError):
            coupe_menu_only(original.replace(b'</aside>', b'</nav>'), accepted)
        with self.assertRaises(ValueError):
            coupe_menu_only(original + b'connect_gateway', accepted)

    def test_private_paths_and_traversal_refused(self):
        for name in ('../x', '/x', '.env', 'api/config.php', 'a\\b'):
            with self.subTest(name=name), self.assertRaises(ValueError):
                menu.operation(name, b'candidate', {'exists': False})

    def test_protections_retained_even_if_candidate_differs(self):
        before = {'exists': True, 'sha256': 'a'*64, 'sha256_lf': 'a'*64, 'mode': 0o640}
        for name in ('.htaccess', 'api/.htaccess', '.user.ini'):
            op = menu.operation(name, b'different candidate', before)
            self.assertEqual(op['action'], 'preserve')
            self.assertEqual(op['after'], before)

    def test_missing_protection_blocks_preparation(self):
        with self.assertRaisesRegex(ValueError, 'protection absent'):
            menu.operation('.htaccess', b'candidate', {'exists': False})

    def test_new_file_has_guarded_inverse(self):
        op = menu.operation('account-menu.js', b'menu', {'exists': False})
        self.assertEqual(op['action'], 'create')
        self.assertEqual(op['rollback'], 'remove_added_file_if_unchanged')
        self.assertEqual(op['after']['mode'], 0o644)

    def test_line_endings_preserved(self):
        before = {'exists': True, 'sha256': menu.digest(b'a\r\n'),
                  'sha256_lf': menu.digest(b'a\n'), 'mode': 0o644}
        self.assertEqual(menu.operation('index.html', b'a\n', before)['after'], before)

    def test_restore_exercise_preserves_active_file(self):
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary).resolve(); active = base / 'active'; active.mkdir()
            (active / 'index.html').write_bytes(b'original\r\n')
            before = menu.record(active / 'index.html')
            ops = menu.recover_files(active, {'index.html': b'candidate'}, base / 'recovery')
            self.assertEqual(ops['index.html']['action'], 'replace')
            self.assertEqual(menu.record(active / 'index.html'), before)
            self.assertEqual(menu.record(base / 'recovery/rehearsal/index.html'), before)

    def test_existing_recovery_is_never_overwritten(self):
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary).resolve(); active = base / 'active'; active.mkdir()
            recovery = base / 'recovery'; recovery.mkdir()
            with self.assertRaisesRegex(ValueError, 'already exists'):
                menu.recover_files(active, {'index.html': b'candidate'}, recovery)

    def test_active_drift_stops_preparation(self):
        with tempfile.TemporaryDirectory() as temporary:
            base = Path(temporary).resolve(); active = base / 'active'; active.mkdir()
            path = active / 'index.html'; path.write_bytes(b'original')
            original = menu.record
            calls = 0
            def drifting_record(p):
                nonlocal calls
                if p == path:
                    calls += 1
                    if calls == 2: path.write_bytes(b'concurrent user change')
                return original(p)
            with patch.object(menu, 'record', side_effect=drifting_record):
                with self.assertRaisesRegex(ValueError, 'active drift'):
                    menu.recover_files(active, {'index.html': b'candidate'}, base / 'recovery')
            self.assertEqual(path.read_bytes(), b'concurrent user change')


if __name__ == '__main__':
    unittest.main()
